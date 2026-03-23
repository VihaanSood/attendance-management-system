// src/routes/employee.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/employee.controller');
const { authenticate, authorize, validate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');

const employeeRules = [
  body('name').trim().notEmpty().withMessage('Employee name is required.'),
  body('age').isInt({ min: 16, max: 80 }).withMessage('Age must be between 16 and 80.'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number.'),
  body('role').trim().notEmpty().withMessage('Role/position is required.'),
  body('joiningDate').isISO8601().withMessage('Valid joining date (YYYY-MM-DD) is required.'),
  body('email').optional().isEmail().withMessage('Valid email required.'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required.'),
];

const idParam = [param('id').isString().notEmpty().withMessage('Valid employee ID required.')];

// Apply auth to all employee routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management (tenant-scoped)
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: List all employees with pagination and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, role, or department
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of employees
 */
router.get('/',     ctrl.findAll);

/**
 * @swagger
 * /employees/departments:
 *   get:
 *     tags: [Employees]
 *     summary: Get list of unique departments in the organization
 *     responses:
 *       200: { description: Array of department names }
 */
router.get('/departments', ctrl.getDepartments);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get a single employee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Employee data }
 *       404: { description: Employee not found }
 */
router.get('/:id',  idParam, validate, ctrl.findOne);

/**
 * @swagger
 * /employees:
 *   post:
 *     tags: [Employees]
 *     summary: Create a new employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, age, salary, role, joiningDate]
 *             properties:
 *               name:        { type: string, example: "Alice Johnson" }
 *               age:         { type: integer, example: 28 }
 *               salary:      { type: number, example: 5000 }
 *               role:        { type: string, example: "Software Engineer" }
 *               department:  { type: string, example: "Engineering" }
 *               joiningDate: { type: string, format: date, example: "2024-01-15" }
 *               email:       { type: string, format: email }
 *               phone:       { type: string }
 *     responses:
 *       201: { description: Employee created }
 *       409: { description: Email already exists in org }
 */
router.post('/',    employeeRules, validate, ctrl.create);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: Update employee details (all fields)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Employee updated }
 *   patch:
 *     tags: [Employees]
 *     summary: Partially update employee details
 *     responses:
 *       200: { description: Employee updated }
 */
router.put('/:id',   idParam, validate, ctrl.update);
router.patch('/:id', idParam, validate, ctrl.update);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     tags: [Employees]
 *     summary: Soft-delete (deactivate) an employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Employee deactivated }
 */
router.delete('/:id', idParam, validate, ctrl.delete);

/**
 * @swagger
 * /employees/{id}/hard-delete:
 *   delete:
 *     tags: [Employees]
 *     summary: Permanently delete an employee and all their records (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Employee permanently deleted }
 *       403: { description: Insufficient role }
 */
router.delete('/:id/hard-delete', idParam, validate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.hardDelete);

module.exports = router;
