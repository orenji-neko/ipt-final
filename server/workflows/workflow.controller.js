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
// General routes
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.put('/:id/status', authorize(Role.Admin), updateStatus);
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
        res.json(workflows);
    } catch (err) { 
        console.error('Error in getAll workflows:', err);
        next(err); 
    }
}

async function getById(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPk(req.params.id, {
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
        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        res.json(workflow);
    } catch (err) { next(err); }
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
        const workflow = await db.Workflow.create(req.body);
        res.status(201).json(workflow);
    } catch (err) { next(err); }
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
        const workflows = await db.Workflow.findAll({
            where: { employeeId: req.params.employeeId },
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
        res.json(workflows);
    } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPk(req.params.id);
        if (!workflow) throw new Error('Workflow not found');
        await workflow.update({ status: req.body.status });
        res.json(workflow);
    } catch (err) { next(err); }
}

async function onboarding(req, res, next) {
    try {
        const workflow = await db.Workflow.create({
            employeeId: req.body.employeeId,
            type: 'Onboarding',
            details: {
                description: req.body.details?.description || 'New employee onboarding process'
            },
            status: 'Pending'
        });
        res.status(201).json(workflow);
    } catch (err) { next(err); }
}

module.exports = router; 