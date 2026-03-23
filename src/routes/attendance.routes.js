// src/routes/attendance.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/attendance.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');

router.use(authenticate);

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'HOLIDAY'];

const markRules = [
  body('employeeId').notEmpty().withMessage('Employee ID is required.'),
  body('date').isISO8601().withMessage('Valid date (YYYY-MM-DD) required.'),
  body('status').isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

const bulkMarkRules = [
  body('date').isISO8601().withMessage('Valid date required.'),
  body('records').isArray({ min: 1 }).withMessage('Records must be a non-empty array.'),
  body('records.*.employeeId').notEmpty().withMessage('Each record must have an employeeId.'),
  body('records.*.status').isIn(VALID_STATUSES).withMessage('Invalid status in records.'),
];

const monthYearQuery = [
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1–12.'),
  query('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year required.'),
];

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance marking and reporting
 */

/**
 * @swagger
 * /attendance/mark:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance for a single employee on a specific date
 *     description: Upserts the record — updates if already exists for that date.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, date, status]
 *             properties:
 *               employeeId: { type: string }
 *               date:       { type: string, format: date, example: "2024-06-15" }
 *               status:     { type: string, enum: [PRESENT, ABSENT, LEAVE, HALF_DAY, HOLIDAY] }
 *               note:       { type: string }
 *               checkIn:    { type: string, format: date-time }
 *               checkOut:   { type: string, format: date-time }
 *     responses:
 *       200: { description: Attendance marked/updated }
 *       404: { description: Employee not found }
 */
router.post('/mark', markRules, validate, ctrl.mark);

/**
 * @swagger
 * /attendance/bulk-mark:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance for multiple employees at once
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, records]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     employeeId: { type: string }
 *                     status: { type: string, enum: [PRESENT, ABSENT, LEAVE, HALF_DAY, HOLIDAY] }
 *                     note: { type: string }
 *     responses:
 *       200: { description: Bulk attendance marked }
 */
router.post('/bulk-mark', bulkMarkRules, validate, ctrl.bulkMark);

/**
 * @swagger
 * /attendance/summary:
 *   get:
 *     tags: [Attendance]
 *     summary: Monthly attendance summary for all employees
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
 *       200: { description: Summary with present/absent/leave counts per employee }
 */
router.get('/summary', monthYearQuery, validate, ctrl.getMonthlySummary);

/**
 * @swagger
 * /attendance/daily/{date}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance for all employees on a specific date
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Daily attendance list — includes NOT_MARKED status }
 */
router.get('/daily/:date', ctrl.getDailyAttendance);

/**
 * @swagger
 * /attendance/employee/{employeeId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance history for a specific employee
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Attendance records + summary counts }
 */
router.get('/employee/:employeeId', ctrl.getEmployeeAttendance);

/**
 * @swagger
 * /attendance/employee/{employeeId}/export:
 *   get:
 *     tags: [Attendance]
 *     summary: Export employee attendance as CSV
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
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/employee/:employeeId/export', monthYearQuery, validate, ctrl.exportCsv);

/**
 * @swagger
 * /attendance/{id}:
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete a specific attendance record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Record deleted }
 *       404: { description: Record not found }
 */
router.delete('/:id', ctrl.delete);

module.exports = router;
