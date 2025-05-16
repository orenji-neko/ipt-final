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

        // Check if employeeId already exists
        const existingEmployee = await db.Employee.findOne({ where: { employeeId } });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee ID already exists' });
        }

        // Check if user exists
        const user = await db.Account.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if department exists
        const department = await db.Department.findByPk(departmentId);
        if (!department) {
            return res.status(400).json({ message: 'Department not found' });
        }

        const employee = await db.Employee.create(req.body);
        res.status(201).json(employee);
    } catch (err) { 
        console.error('Employee creation error:', err);
        res.status(500).json({ message: err.message || 'An error occurred while creating the employee' });
    }
}

async function getAll(req, res, next) {
    try {
        const employees = await db.Employee.findAll({
            include: [
                { model: db.Account, as: 'user' },
                { model: db.Department }
            ]
        });
        res.json(employees);
    } catch (err) { 
        console.error('Error fetching employees:', err);
        res.status(500).json({ message: 'Error fetching employees' });
    }
}

async function getById(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id, {
            include: [
                { model: db.Account, as: 'user' },
                { model: db.Department }
            ]
        });
        if (!employee) throw new Error('Employee not found');
        res.json(employee);
    } catch (err) { 
        console.error('Error fetching employee:', err);
        res.status(500).json({ message: 'Error fetching employee' });
    }
}

async function update(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id);
        if (!employee) throw new Error('Employee not found');
        await employee.update(req.body);
        res.json(employee);
    } catch (err) { next(err); }
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
        const employee = await db.Employee.findByPk(req.params.id);
        if (!employee) throw new Error('Employee not found');
        await employee.update({ departmentId: req.body.departmentId });
        await db.Workflow.create({
            employeeId: employee.id,
            type: 'Transfer',
            details: { newDepartmentId: req.body.departmentId }
        });
        res.json({ message: 'Employee transferred' });
    } catch (err) { next(err); }
}

module.exports = router; 