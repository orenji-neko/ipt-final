const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

router.post('/', authorize(Role.Admin), create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);
router.post('/:id/transfer', authorize(Role.Admin), transfer);

async function create(req, res, next) {
    try {
        // Validate required fields
        const { employeeId, userId, position, departmentId, hireDate, status } = req.body;
        
        if (!employeeId || !userId || !position || !departmentId || !hireDate || !status) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        console.log('Creating employee with data:', req.body);

        // Check if employeeId already exists
        const existingEmployee = await db.Employee.findOne({ where: { employeeId } });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee ID already exists' });
        }

        // Check if user exists and is active
        const user = await db.Account.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        // Verify user is active
        if (user.status !== 'Active') {
            return res.status(400).json({ message: 'Cannot create employee with inactive user account' });
        }

        // Check if department exists
        const department = await db.Department.findByPk(departmentId);
        if (!department) {
            return res.status(400).json({ message: 'Department not found' });
        }

        // Create the employee record with the provided employeeId
        const employee = await db.Employee.create({
            employeeId,
            userId,
            position,
            departmentId,
            hireDate,
            status
        });
        
        console.log('Employee created successfully:', employee.toJSON());

        // Create onboarding workflow
        const workflowCount = await db.Workflow.count();
        const workflowId = 'WF' + String(workflowCount + 1).padStart(3, '0');
        
        await db.Workflow.create({
            employeeId: employee.id,
            type: 'Onboarding',
            status: 'Pending',
            message: `Onboarding started for ${employeeId}`,
            details: { 
                task: 'Setup workstation',
                workflowId: workflowId
            }
        });
        
        console.log(`Onboarding workflow ${workflowId} created for employee: ${employeeId}`);

        // Fetch the created employee with its associations to return
        const createdEmployee = await db.Employee.findByPk(employee.id, {
            include: [
                { model: db.Account, as: 'user' },
                { model: db.Department }
            ]
        });

        res.status(201).json(createdEmployee);
    } catch (err) { 
        console.error('Employee creation error:', err);
        res.status(500).json({ message: err.message || 'An error occurred while creating the employee' });
    }
}

async function getAll(req, res, next) {
    try {
        const employees = await db.Employee.findAll({
            include: [
                { 
                    model: db.Account, 
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
                },
                { 
                    model: db.Department,
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`Fetched ${employees.length} employees with account and department details`);
        
        // Transform employee data to match frontend expectations
        const formattedEmployees = employees.map(emp => {
            const employee = emp.toJSON();
            return {
                id: employee.employeeId, // Use employeeId as the frontend id
                userId: employee.userId,
                accountId: employee.userId, // Add accountId for frontend compatibility
                position: employee.position,
                departmentId: employee.departmentId,
                hireDate: employee.hireDate,
                status: employee.status,
                account: employee.user,
                department: employee.Department,
                createdAt: employee.createdAt,
                updatedAt: employee.updatedAt
            };
        });
        
        res.json(formattedEmployees);
    } catch (err) { 
        console.error('Error fetching employees:', err);
        res.status(500).json({ message: 'Error fetching employees' });
    }
}

async function getById(req, res, next) {
    try {
        const id = req.params.id;
        console.log(`Looking up employee with ID: ${id}`);
        
        // Try to find by employeeId (string format like EMP001) first
        let employee = await db.Employee.findOne({
            where: { employeeId: id },
            include: [
                { 
                    model: db.Account, 
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
                },
                { 
                    model: db.Department,
                    attributes: ['id', 'name', 'description']
                }
            ]
        });
        
        // If not found by employeeId, try to find by primary key (numeric id)
        if (!employee && !isNaN(id)) {
            employee = await db.Employee.findByPk(id, {
                include: [
                    { 
                        model: db.Account, 
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
                    },
                    { 
                        model: db.Department,
                        attributes: ['id', 'name', 'description']
                    }
                ]
            });
        }
        
        if (!employee) {
            console.log(`Employee not found with ID: ${id}`);
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        console.log(`Found employee: ${employee.employeeId}`);
        
        // Format employee data to match frontend expectations
        const formattedEmployee = {
            id: employee.employeeId,
            userId: employee.userId,
            accountId: employee.userId,
            position: employee.position,
            departmentId: employee.departmentId,
            hireDate: employee.hireDate,
            status: employee.status,
            account: employee.user,
            department: employee.Department,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt
        };
        
        res.json(formattedEmployee);
    } catch (err) { 
        console.error('Error fetching employee:', err);
        res.status(500).json({ message: 'Error fetching employee' });
    }
}

async function update(req, res, next) {
    try {
        // Find employee by employeeId first, then by primary key if not found
        let employee;
        employee = await db.Employee.findOne({ where: { employeeId: req.params.id } });
        
        if (!employee && !isNaN(req.params.id)) {
            employee = await db.Employee.findByPk(req.params.id);
        }
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        console.log(`Updating employee ${employee.employeeId}`, req.body);
        
        // Prepare update data
        const updateData = {
            position: req.body.position,
            departmentId: req.body.departmentId,
            status: req.body.status,
            updatedAt: new Date()
        };
        
        // Only update fields that are provided
        const allowedFields = ['position', 'departmentId', 'status', 'hireDate'];
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key) && req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        });
        
        await employee.update(updateData);
        
        // Fetch updated employee with associations
        const updatedEmployee = await db.Employee.findByPk(employee.id, {
            include: [
                { 
                    model: db.Account, 
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
                },
                { 
                    model: db.Department,
                    attributes: ['id', 'name', 'description']
                }
            ]
        });
        
        // Format employee data to match frontend expectations
        const formattedEmployee = {
            id: updatedEmployee.employeeId,
            userId: updatedEmployee.userId,
            accountId: updatedEmployee.userId,
            position: updatedEmployee.position,
            departmentId: updatedEmployee.departmentId,
            hireDate: updatedEmployee.hireDate,
            status: updatedEmployee.status,
            account: updatedEmployee.user,
            department: updatedEmployee.Department,
            createdAt: updatedEmployee.createdAt,
            updatedAt: updatedEmployee.updatedAt
        };
        
        res.json(formattedEmployee);
    } catch (err) {
        console.error('Error updating employee:', err);
        next(err);
    }
}

async function _delete(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id);
        if (!employee) throw new Error('Employee not found');
        await employee.destroy();
        res.json({ message: 'Employee deleted' });
    } catch (err) { next(err); }
}

async function transfer(req, res, next) {
    try {
        // Find employee by employeeId first, then by primary key if not found
        let employee;
        employee = await db.Employee.findOne({ where: { employeeId: req.params.id } });
        
        if (!employee && !isNaN(req.params.id)) {
            employee = await db.Employee.findByPk(req.params.id);
        }
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        // Get department info for the workflow
        const department = await db.Department.findByPk(req.body.departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        
        // Update employee with new department
        await employee.update({ 
            departmentId: req.body.departmentId,
            updatedAt: new Date()
        });
        
        // Create workflow for the transfer
        const workflowCount = await db.Workflow.count();
        const workflowId = 'WF' + String(workflowCount + 1).padStart(3, '0');
        
        await db.Workflow.create({
            employeeId: employee.id,
            type: 'Transfer',
            status: 'Pending',
            message: `Employee ${employee.employeeId} transferred to ${department.name} department`,
            details: { 
                newDepartmentId: req.body.departmentId,
                oldDepartmentId: employee.previous('departmentId'),
                workflowId: workflowId,
                departmentName: department.name
            }
        });
        
        console.log(`Transfer workflow ${workflowId} created for employee: ${employee.employeeId}`);
        
        // Fetch updated employee with associations
        const updatedEmployee = await db.Employee.findByPk(employee.id, {
            include: [
                { 
                    model: db.Account, 
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
                },
                { 
                    model: db.Department,
                    attributes: ['id', 'name', 'description']
                }
            ]
        });
        
        // Format employee data to match frontend expectations
        const formattedEmployee = {
            id: updatedEmployee.employeeId,
            userId: updatedEmployee.userId,
            accountId: updatedEmployee.userId,
            position: updatedEmployee.position,
            departmentId: updatedEmployee.departmentId,
            hireDate: updatedEmployee.hireDate,
            status: updatedEmployee.status,
            account: updatedEmployee.user,
            department: updatedEmployee.Department,
            createdAt: updatedEmployee.createdAt,
            updatedAt: updatedEmployee.updatedAt
        };
        
        res.json({
            message: 'Employee transferred successfully',
            employee: formattedEmployee
        });
    } catch (err) { 
        console.error('Error transferring employee:', err);
        next(err); 
    }
}

module.exports = router; 