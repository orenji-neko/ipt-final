const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// CRUD operations for workflows
router.post('/', authorize(Role.Admin), create);
// Specific routes must come before general routes with parameters
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.post('/onboarding', authorize(Role.Admin), onboarding);
// Status update routes - support both PATCH and PUT for compatibility
router.patch('/:id/status', authorize(), updateStatus);
router.put('/:id/status', authorize(), updateStatus); // Keep PUT for backward compatibility
// General routes
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);

async function getAll(req, res, next) {
    try {
        console.log('Getting all workflows');
        // Get all workflows with associated employee data
        const workflows = await db.Workflow.findAll({
            include: [{
                model: db.Employee,
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }]
            }],
            order: [['id', 'DESC']]
        });
        console.log(`Found ${workflows.length} workflows`);
        
        // Format workflows to match frontend expectations
        const formattedWorkflows = workflows.map(workflow => {
            const plainWorkflow = workflow.get({ plain: true });
            return {
                ...plainWorkflow,
                id: plainWorkflow.workflowId // Use workflowId as id for frontend compatibility
            };
        });
        
        res.json(formattedWorkflows);
    } catch (err) { 
        console.error('Error in getAll workflows:', err);
        next(err); 
    }
}

async function getById(req, res, next) {
    try {
        const id = req.params.id;
        console.log(`Looking up workflow with ID: ${id}`);
        
        // Try to find by workflowId (string format like WF001) first
        let workflow = await db.Workflow.findOne({
            where: { workflowId: id },
            include: [{
                model: db.Employee,
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }]
            }]
        });
        
        // If not found by workflowId, try to find by primary key (numeric id)
        if (!workflow && !isNaN(id)) {
            workflow = await db.Workflow.findByPk(id, {
                include: [{
                    model: db.Employee,
                    as: 'employee',
                    include: [{
                        model: db.Account,
                        as: 'user',
                        attributes: ['firstName', 'lastName', 'email']
                    }]
                }]
            });
        }
        
        if (!workflow) {
            console.log(`Workflow not found with ID: ${id}`);
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        // Format workflow to match frontend expectations
        const plainWorkflow = workflow.get({ plain: true });
        const formattedWorkflow = {
            ...plainWorkflow,
            id: plainWorkflow.workflowId // Use workflowId as id for frontend compatibility
        };
        
        res.json(formattedWorkflow);
    } catch (err) { 
        console.error('Error fetching workflow:', err);
        next(err); 
    }
}

async function _delete(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPk(req.params.id);
        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        await workflow.destroy();
        res.json({ message: 'Workflow deleted successfully' });
    } catch (err) { next(err); }
}

async function create(req, res, next) {
    try {
        // Count existing workflows to generate the next ID
        const workflowCount = await db.Workflow.count();
        const workflowId = 'WF' + String(workflowCount + 1).padStart(3, '0');
        
        // Create the workflow with the workflowId
        const workflow = await db.Workflow.create({
            ...req.body,
            workflowId: workflowId
        });
        
        console.log(`Created workflow ${workflowId} successfully`);
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating workflow:', err);
        next(err); 
    }
}

async function update(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPk(req.params.id);
        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        
        Object.assign(workflow, req.body);
        await workflow.save();
        
        res.json(workflow);
    } catch (err) { next(err); }
}

async function getByEmployeeId(req, res, next) {
    try {
        const employeeIdParam = req.params.employeeId;
        console.log(`Getting workflows for employee ID: ${employeeIdParam}`);
        
        // Find the employee by employeeId (string) or id (number)
        let employee;
        let employeeId;
        
        if (isNaN(employeeIdParam)) {
            // If employeeId is not a number, search by string employeeId
            employee = await db.Employee.findOne({ where: { employeeId: employeeIdParam } });
            employeeId = employee ? employee.id : null;
        } else {
            // If employeeId is a number, use it directly
            employeeId = employeeIdParam;
        }
        
        if (!employeeId) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        const workflows = await db.Workflow.findAll({
            where: { employeeId: employeeId },
            include: [{
                model: db.Employee,
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }]
            }],
            order: [['id', 'DESC']]
        });
        
        console.log(`Found ${workflows.length} workflows for employee ID: ${employeeIdParam}`);
        
        // Format workflows to match frontend expectations
        const formattedWorkflows = workflows.map(workflow => {
            const plainWorkflow = workflow.get({ plain: true });
            
            // Ensure workflowId is set - if not, generate one using the numeric ID
            if (!plainWorkflow.workflowId) {
                plainWorkflow.workflowId = 'WF' + String(plainWorkflow.id).padStart(3, '0');
                // Update the database with the generated ID
                workflow.update({ workflowId: plainWorkflow.workflowId }).catch(err => {
                    console.error(`Failed to update workflow ${plainWorkflow.id} with workflowId:`, err);
                });
            }
            
            return {
                ...plainWorkflow,
                id: plainWorkflow.workflowId // Use workflowId as id for frontend compatibility
            };
        });
        
        console.log('Sending formatted workflows to client:', JSON.stringify(formattedWorkflows, null, 2));
        res.json(formattedWorkflows);
    } catch (err) { 
        console.error('Error getting workflows by employee ID:', err);
        next(err); 
    }
}

async function updateStatus(req, res, next) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        
        console.log(`[WORKFLOW] Updating status for workflow ID: ${id} to ${status}`);
        
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        
        // Try to find by workflowId (string format like WF001) first
        let workflow = await db.Workflow.findOne({
            where: { workflowId: id }
        });
        
        // If not found by workflowId, try to find by primary key (numeric id)
        if (!workflow && !isNaN(id)) {
            workflow = await db.Workflow.findByPk(id);
        }
        
        if (!workflow) {
            console.log(`[WORKFLOW] Workflow not found with ID: ${id}`);
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        console.log(`[WORKFLOW] Found workflow:`, JSON.stringify(workflow.toJSON(), null, 2));
        
        // Update the workflow status
        await workflow.update({ 
            status: status,
            updatedAt: new Date()
        });
        console.log(`[WORKFLOW] Workflow ${workflow.workflowId || workflow.id} status updated to: ${status}`);
        
        // If this is a Request Approval workflow, update the corresponding request status
        let requestUpdated = false;
        let requestUpdateMessage = null;
        
        if (workflow.type === 'Request Approval') {
            console.log('[REQUEST] This is a Request Approval workflow, attempting to update request status...');
            console.log('[REQUEST] Workflow details:', JSON.stringify(workflow.details, null, 2));
            
            // Handle both null details and missing requestId
            if (!workflow.details) {
                console.log('[REQUEST] Warning: workflow.details is null or undefined');
                workflow.details = {};
                await workflow.save();
            }
            
            let requestId = null;
            
            // Try to get requestId from details object
            if (workflow.details && workflow.details.requestId) {
                requestId = workflow.details.requestId;
                console.log(`[REQUEST] Found requestId in workflow details: ${requestId}`);
            } else {
                // Try to extract request ID from message field as a fallback
                console.log('[REQUEST] No requestId found in workflow details, checking message...');
                if (workflow.message) {
                    // Look for patterns like REQ001 in the message
                    const reqMatch = workflow.message.match(/REQ\d+/);
                    if (reqMatch) {
                        requestId = reqMatch[0];
                        console.log(`[REQUEST] Extracted requestId from message: ${requestId}`);
                        
                        // Update the workflow.details to include this requestId for future reference
                        workflow.details = {
                            ...workflow.details,
                            requestId: requestId
                        };
                        await workflow.save();
                        console.log(`[REQUEST] Updated workflow details with requestId: ${requestId}`);
                    }
                }
            }
            
            if (requestId) {
                try {
                    console.log(`[REQUEST] Looking for request with ID: ${requestId}`);
                    
                    // First try to find by requestId field (string format like REQ001)
                    let request = await db.Request.findOne({ 
                        where: { requestId: requestId }
                    });
                    
                    // If not found by requestId, try by primary key (numeric id)
                    if (!request && !isNaN(requestId)) {
                        console.log(`[REQUEST] Not found by requestId, trying by primary key: ${requestId}`);
                        request = await db.Request.findByPk(requestId);
                    }
                    
                    if (request) {
                        console.log(`[REQUEST] Found request:`, JSON.stringify(request.toJSON(), null, 2));
                        await request.update({ 
                            status: status,
                            updatedAt: new Date()
                        });
                        requestUpdated = true;
                        requestUpdateMessage = `Request ${request.requestId || request.id} status updated to: ${status}`;
                        console.log(`[REQUEST] ${requestUpdateMessage}`);
                    } else {
                        console.log(`[REQUEST] Request not found with ID: ${requestId}`);
                        requestUpdateMessage = `Request with ID ${requestId} not found`;
                    }
                } catch (reqErr) {
                    console.error('[REQUEST] Error updating request status:', reqErr);
                    requestUpdateMessage = `Error updating request: ${reqErr.message}`;
                    // We don't want to fail the whole operation if just the request update fails
                }
            } else {
                console.log('[REQUEST] No requestId could be found or extracted');
                requestUpdateMessage = 'No request ID found in workflow details or message';
            }
        } else {
            console.log(`[WORKFLOW] Not a Request Approval workflow, skipping request update`);
        }
        
        // Get the updated workflow with employee data
        const updatedWorkflow = await db.Workflow.findByPk(workflow.id, {
            include: [{
                model: db.Employee,
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }]
            }]
        });
        
        // Format the workflow response to match frontend expectations
        const plainWorkflow = updatedWorkflow.get({ plain: true });
        const formattedWorkflow = {
            ...plainWorkflow,
            id: plainWorkflow.workflowId, // Use workflowId as id for frontend compatibility
            requestUpdated, // Include flag to indicate if a request was updated
            requestUpdateMessage // Include status message about request update
        };
        
        console.log('[WORKFLOW] Returning updated workflow:', JSON.stringify(formattedWorkflow, null, 2));
        res.json(formattedWorkflow);
    } catch (err) { 
        console.error('[WORKFLOW] Error updating workflow status:', err);
        next(err); 
    }
}

async function onboarding(req, res, next) {
    try {
        // Count existing workflows to generate the next ID
        const workflowCount = await db.Workflow.count();
        const workflowId = 'WF' + String(workflowCount + 1).padStart(3, '0');
        
        const workflow = await db.Workflow.create({
            employeeId: req.body.employeeId,
            workflowId: workflowId,
            type: 'Onboarding',
            details: {
                description: req.body.details?.description || 'New employee onboarding process',
                workflowId: workflowId
            },
            status: 'Pending',
            message: req.body.message || 'Employee onboarding workflow initiated'
        });
        
        console.log(`Created onboarding workflow ${workflowId} for employee ID: ${req.body.employeeId}`);
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating onboarding workflow:', err);
        next(err); 
    }
}

module.exports = router; 