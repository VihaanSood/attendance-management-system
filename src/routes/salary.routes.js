// src/routes/salary.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/salary.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { param, query } = require('express-validator');

router.use(authenticate);

const monthYearQuery = [
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1–12.'),
  query('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year required.'),
];

/**
 * @swagger
 * tags:
 *   name: Salary
 *   description: Salary calculation and payroll reports
 */

/**
 * @swagger
 * /salary/payroll:
 *   get:
 *     tags: [Salary]
 *     summary: Calculate payroll for ALL active employees in a given month
 *     description: |
 *       Formula:
 *       - `salary_per_day = monthly_salary / configured_working_days`
 *       - `effective_days = present_days + (half_days * 0.5)`
 *       - `final_salary = effective_days * salary_per_day`
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer, example: 6 }
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer, example: 2024 }
 *     responses:
 *       200:
 *         description: Full payroll report for the period
 */
router.get('/payroll', monthYearQuery, validate, ctrl.calculatePayroll);

/**
 * @swagger
 * /salary/payroll/export/csv:
 *   get:
 *     tags: [Salary]
 *     summary: Export payroll report as CSV
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema: { type: string }
 */
router.get('/payroll/export/csv', monthYearQuery, validate, ctrl.exportCsv);

/**
 * @swagger
 * /salary/payroll/export/pdf:
 *   get:
 *     tags: [Salary]
 *     summary: Export payroll report as PDF
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get('/payroll/export/pdf', monthYearQuery, validate, ctrl.exportPdf);

/**
 * @swagger
 * /salary/employee/{employeeId}:
 *   get:
 *     tags: [Salary]
 *     summary: Calculate salary for a single employee
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Salary breakdown for the employee }
 *       404: { description: Employee not found }
 */
router.get('/employee/:employeeId', monthYearQuery, validate, ctrl.calculateEmployee);

module.exports = router;
