const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

router.post('/', authorize(), create);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.put('/:id', authorize(), update);
router.patch('/:id/status', authorize(), updateStatus);
router.delete('/:id', authorize(Role.Admin), _delete);

async function create(req, res, next) {
    try {
        // Count existing requests to generate the next ID
        const requestCount = await db.Request.count();
        const requestId = 'REQ' + String(requestCount + 1).padStart(3, '0');
        
        // Ensure we have an employeeId from either the request body or the user's token
        let employeeIdParam = req.body.employeeId || req.user.employeeId;
        
        if (!employeeIdParam) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }
        
        // Find the employee by employeeId (string) or id (number)
        let employee;
        if (isNaN(employeeIdParam)) {
            // If employeeId is not a number, search by string employeeId
            employee = await db.Employee.findOne({ where: { employeeId: employeeIdParam } });
        } else {
            // If employeeId is a number, search by numeric id
            employee = await db.Employee.findByPk(employeeIdParam);
        }
        
        if (!employee) {
            return res.status(400).json({ message: 'Employee not found' });
        }
        
        const request = await db.Request.create({
            ...req.body,
            requestId,
            employeeId: employee.id // Use the numeric primary key ID from the employee record
        });
        
        // If request items are provided, create them
        if (req.body.items && Array.isArray(req.body.items)) {
            const items = req.body.items.map(item => ({
                ...item,
                requestId: request.id
            }));
            await db.RequestItem.bulkCreate(items);
        }
        
        // Create a workflow for this request
        const workflowCount = await db.Workflow.count();
        const workflowId = 'WF' + String(workflowCount + 1).padStart(3, '0');
        
        await db.Workflow.create({
            employeeId: employee.id,
            workflowId: workflowId,
            type: 'Request Approval',
            status: 'Pending',
            details: {
                requestId: request.id,
                requestType: request.type,
                requesterId: employee.id
            },
            message: `Review ${request.type} request #${requestId} from Employee ID ${employee.employeeId}.`
        });
        
        console.log(`Workflow ${workflowId} created for request: ${requestId}`);
        
        // Return formatted request with items and employee
        const formattedRequest = await db.Request.findByPk(request.id, {
            include: [
                { model: db.RequestItem },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'user' },
                        { model: db.Department }
                    ]
                }
            ]
        });
        
        // Format the response to match the frontend expectations
        const responseData = {
            ...formattedRequest.get({ plain: true }),
            id: formattedRequest.requestId // Ensure the id is set to requestId for frontend compatibility
        };
        
        res.status(201).json(responseData);
    } catch (err) { 
        console.error('Error creating request:', err);
        next(err); 
    }
}

async function getAll(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            include: [
                { model: db.RequestItem },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'user' },
                        { model: db.Department }
                    ]
                }
            ]
        });
        
        // Format requests to match frontend expectations
        const formattedRequests = requests.map(request => {
            const plainRequest = request.get({ plain: true });
            
            // Format employee data if available
            let employee = null;
            let employeeEmail = null;
            if (plainRequest.Employee) {
                employee = {
                    id: plainRequest.Employee.employeeId,
                    userId: plainRequest.Employee.userId,
                    position: plainRequest.Employee.position,
                    status: plainRequest.Employee.status
                };
                
                if (plainRequest.Employee.user) {
                    employeeEmail = plainRequest.Employee.user.email;
                    employee.account = plainRequest.Employee.user;
                }
            }
            
            // Ensure items are available in both formats that the frontend might expect
            const items = plainRequest.RequestItems || [];
            
            return {
                ...plainRequest,
                id: plainRequest.requestId, // Use requestId as the id for frontend compatibility
                employeeEmail: employeeEmail,
                Employee: employee,
                items: items,
                RequestItems: items // Include both formats for compatibility
            };
        });
        
        console.log('Formatted requests:', JSON.stringify(formattedRequests, null, 2));
        res.json(formattedRequests);
    } catch (err) { 
        console.error('Error fetching requests:', err);
        next(err); 
    }
}

async function getById(req, res, next) {
    try {
        const id = req.params.id;
        console.log(`Looking up request with ID: ${id}`);
        
        // Try to find by requestId (string format like REQ001) first
        let request = await db.Request.findOne({
            where: { requestId: id },
            include: [
                { model: db.RequestItem },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'user' },
                        { model: db.Department }
                    ]
                }
            ]
        });
        
        // If not found by requestId, try to find by primary key (numeric id)
        if (!request && !isNaN(id)) {
            request = await db.Request.findByPk(id, {
                include: [
                    { model: db.RequestItem },
                    { 
                        model: db.Employee,
                        include: [
                            { model: db.Account, as: 'user' },
                            { model: db.Department }
                        ]
                    }
                ]
            });
        }
        
        if (!request) {
            console.log(`Request not found with ID: ${id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        
        if (req.user.role !== Role.Admin && request.employeeId !== req.user.employeeId) {
            console.log(`Unauthorized access attempt by user: ${req.user.id}`);
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        // Get a plain object of the request and associated data
        const plainRequest = request.get({ plain: true });
        
        // Format the response to match frontend expectations
        const formattedRequest = {
            id: plainRequest.requestId, // Use requestId as the id for frontend compatibility
            type: plainRequest.type,
            status: plainRequest.status,
            employeeId: plainRequest.Employee ? plainRequest.Employee.employeeId : plainRequest.employeeId,
            employeeEmail: plainRequest.Employee?.user?.email,
            details: plainRequest.details,
            // Ensure items are available in the format the frontend expects
            items: plainRequest.RequestItems?.map(item => ({
                name: item.name,
                quantity: item.quantity,
                notes: item.notes || '',
                requestId: item.requestId
            })) || [],
            // Include employee object for frontend use
            Employee: plainRequest.Employee ? {
                id: plainRequest.Employee.employeeId,
                position: plainRequest.Employee.position,
                status: plainRequest.Employee.status,
                account: plainRequest.Employee.user
            } : null
        };
        
        console.log('Formatted request for edit:', JSON.stringify(formattedRequest, null, 2));
        res.json(formattedRequest);
    } catch (err) { 
        console.error('Error fetching request:', err);
        next(err); 
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        const employeeId = req.params.employeeId;
        
        // Find the employee by employeeId (string) or id (number)
        let employee;
        if (isNaN(employeeId)) {
            // If employeeId is not a number, search by string employeeId
            employee = await db.Employee.findOne({ 
                where: { employeeId: employeeId },
                include: [
                    { model: db.Account, as: 'user' },
                    { model: db.Department }
                ]
            });
        } else {
            // If employeeId is a number, search by numeric id
            employee = await db.Employee.findByPk(employeeId, {
                include: [
                    { model: db.Account, as: 'user' },
                    { model: db.Department }
                ]
            });
        }
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        // Find requests for this employee using the employee's numeric id
        const requests = await db.Request.findAll({
            where: { employeeId: employee.id },
            include: [
                { model: db.RequestItem },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'user' },
                        { model: db.Department }
                    ]
                }
            ]
        });
        
        // Format requests to match frontend expectations
        const formattedRequests = requests.map(request => {
            const plainRequest = request.get({ plain: true });
            
            // Format employee data
            let formattedEmployee = {
                id: employee.employeeId,
                userId: employee.userId,
                position: employee.position,
                status: employee.status
            };
            
            let employeeEmail = null;
            if (employee.user) {
                employeeEmail = employee.user.email;
                formattedEmployee.account = employee.user;
            }
            
            // Ensure items are available in both formats that the frontend might expect
            const items = plainRequest.RequestItems || [];
            
            return {
                ...plainRequest,
                id: plainRequest.requestId, // Use requestId as the id for frontend compatibility
                employeeEmail: employeeEmail,
                Employee: formattedEmployee,
                items: items,
                RequestItems: items // Include both formats for compatibility
            };
        });
        
        console.log('Formatted employee requests:', JSON.stringify(formattedRequests, null, 2));
        res.json(formattedRequests);
    } catch (err) { 
        console.error('Error fetching employee requests:', err);
        next(err); 
    }
}

async function update(req, res, next) {
    try {
        const id = req.params.id;
        console.log(`Updating request with ID: ${id}`, req.body);
        
        // Try to find by requestId (string format like REQ001) first
        let request = await db.Request.findOne({
            where: { requestId: id }
        });
        
        // If not found by requestId, try to find by primary key (numeric id)
        if (!request && !isNaN(id)) {
            request = await db.Request.findByPk(id);
        }
        
        if (!request) {
            console.log(`Request not found with ID: ${id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Allow users to update only their own requests
        if (req.user.role !== Role.Admin && request.employeeId !== req.user.employeeId) {
            console.log(`Unauthorized update attempt by user: ${req.user.id}`);
            return res.status(403).json({ message: 'Unauthorized - You can only update your own requests' });
        }
        
        // Extract the employeeId from the request body - might be a string or an object
        let employeeId = req.body.employeeId;
        let employee;
        
        // If employeeId is provided, find the corresponding employee
        if (employeeId) {
            if (isNaN(employeeId)) {
                // If employeeId is not a number, search by string employeeId
                employee = await db.Employee.findOne({ 
                    where: { employeeId: employeeId },
                    include: [{ model: db.Account, as: 'user' }]
                });
            } else {
                // If employeeId is a number, search by numeric id
                employee = await db.Employee.findByPk(employeeId, {
                    include: [{ model: db.Account, as: 'user' }]
                });
            }
            
            if (!employee) {
                return res.status(400).json({ message: 'Employee not found' });
            }
            
            // Set the numeric employeeId for the database
            employeeId = employee.id;
        } else {
            // Get the employee for workflow creation
            employee = await db.Employee.findByPk(request.employeeId, {
                include: [{ model: db.Account, as: 'user' }]
            });
        }
        
        // Prepare the update data
        const updateData = {
            ...req.body,
            employeeId: employeeId || request.employeeId
        };
        
        // Remove items from the update data (will be handled separately)
        delete updateData.items;
        delete updateData.RequestItems;
        delete updateData.Employee;
        delete updateData.id; // Don't update the ID
        
        console.log('Update data:', updateData);
        
        // If not admin, only allow updating certain fields (like items), not status
        if (req.user.role !== Role.Admin && req.body.status) {
            delete updateData.status; // Keep the original status
        }
        
        // Update the request
        await request.update(updateData);
        
        // Update request items if provided
        if (req.body.items && Array.isArray(req.body.items)) {
            console.log('Updating items:', req.body.items);
            await db.RequestItem.destroy({ where: { requestId: request.id } });
            
            if (req.body.items.length > 0) {
            await db.RequestItem.bulkCreate(req.body.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    notes: item.notes || null,
                requestId: request.id
            })));
            }
        }
        
        // Create a workflow for this request update
        const workflowCount = await db.Workflow.count();
        const workflowId = 'WF' + String(workflowCount + 1).padStart(3, '0');
        
        await db.Workflow.create({
            employeeId: employee.id,
            workflowId: workflowId,
            type: 'Request Approval',
            status: 'Pending',
            details: {
                requestId: request.id,
                requestType: request.type,
                requesterId: employee.id,
                isUpdate: true
            },
            message: `Review updated ${request.type} request #${request.requestId} from Employee ID ${employee.employeeId}.`
        });
        
        console.log(`Update workflow ${workflowId} created for request: ${request.requestId}`);
        
        // Return the updated request with items and employee details
        const updatedRequest = await db.Request.findByPk(request.id, {
            include: [
                { model: db.RequestItem },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'user' },
                        { model: db.Department }
                    ]
                }
            ]
        });
        
        // Format the response to match frontend expectations
        const plainRequest = updatedRequest.get({ plain: true });
        const formattedRequest = {
            id: plainRequest.requestId, // Use requestId as the id for frontend compatibility
            type: plainRequest.type,
            status: plainRequest.status,
            employeeId: plainRequest.Employee ? plainRequest.Employee.employeeId : plainRequest.employeeId,
            employeeEmail: plainRequest.Employee?.user?.email,
            details: plainRequest.details,
            items: plainRequest.RequestItems?.map(item => ({
                name: item.name,
                quantity: item.quantity,
                notes: item.notes || '',
                requestId: item.requestId
            })) || [],
            Employee: plainRequest.Employee ? {
                id: plainRequest.Employee.employeeId,
                position: plainRequest.Employee.position,
                status: plainRequest.Employee.status,
                account: plainRequest.Employee.user
            } : null
        };
        
        console.log('Updated request:', JSON.stringify(formattedRequest, null, 2));
        res.json(formattedRequest);
    } catch (err) { 
        console.error('Error updating request:', err);
        next(err); 
    }
}

async function updateStatus(req, res, next) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        
        console.log(`Updating status for request ID: ${id} to ${status}`);
        
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        
        // Try to find by requestId (string format like REQ001) first
        let request = await db.Request.findOne({
            where: { requestId: id }
        });
        
        // If not found by requestId, try to find by primary key (numeric id)
        if (!request && !isNaN(id)) {
            request = await db.Request.findByPk(id);
        }
        
        if (!request) {
            console.log(`Request not found with ID: ${id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Update the request status
        await request.update({ 
            status: status,
            updatedAt: new Date()
        });
        console.log(`Request ${request.requestId || request.id} status updated to: ${status}`);
        
        // Get the updated request with employee data
        const updatedRequest = await db.Request.findByPk(request.id, {
            include: [
                { model: db.RequestItem },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'user' },
                        { model: db.Department }
                    ]
                }
            ]
        });
        
        // Format the response to match frontend expectations
        const plainRequest = updatedRequest.get({ plain: true });
        const formattedRequest = {
            ...plainRequest,
            id: plainRequest.requestId, // Use requestId as id for frontend compatibility
        };
        
        console.log('Returning updated request:', JSON.stringify(formattedRequest, null, 2));
        res.json(formattedRequest);
    } catch (err) { 
        console.error('Error updating request status:', err);
        next(err); 
    }
}

async function _delete(req, res, next) {
    try {
        const id = req.params.id;
        
        // Try to find by requestId (string format like REQ001) first
        let request = await db.Request.findOne({
            where: { requestId: id }
        });
        
        // If not found by requestId, try to find by primary key (numeric id)
        if (!request && !isNaN(id)) {
            request = await db.Request.findByPk(id);
        }
        
        if (!request) throw new Error('Request not found');
        
        await request.destroy();
        res.json({ message: 'Request deleted' });
    } catch (err) { next(err); }
}

module.exports = router; 