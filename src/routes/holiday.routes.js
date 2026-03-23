// src/routes/holiday.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/holiday.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Holidays
 *   description: Holiday calendar management
 */

/**
 * @swagger
 * /holidays:
 *   get:
 *     tags: [Holidays]
 *     summary: Get all holidays (optionally filter by year)
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2024 }
 *     responses:
 *       200: { description: List of holidays }
 *   post:
 *     tags: [Holidays]
 *     summary: Add a holiday to the calendar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, date]
 *             properties:
 *               name:        { type: string, example: "Independence Day" }
 *               date:        { type: string, format: date, example: "2024-07-04" }
 *               description: { type: string }
 *     responses:
 *       201: { description: Holiday added }
 *       409: { description: Holiday already exists on this date }
 */
router.get('/',   ctrl.findAll);
router.post('/',  [body('name').notEmpty(), body('date').isISO8601()], validate, ctrl.create);

/**
 * @swagger
 * /holidays/mark-attendance:
 *   post:
 *     tags: [Holidays]
 *     summary: Mark HOLIDAY attendance for all active employees on a specific date
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string, format: date, example: "2026-12-25" }
 *     responses:
 *       200: { description: Attendance marked for all employees }
 */
router.post('/mark-attendance', [body('date').isISO8601()], validate, ctrl.markAttendance);

/**
 * @swagger
 * /holidays/unmark-attendance:
 *   delete:
 *     tags: [Holidays]
 *     summary: Remove HOLIDAY attendance records for all employees on a specific date
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string, format: date, example: "2026-12-25" }
 *     responses:
 *       200: { description: Holiday attendance removed }
 */
router.delete('/unmark-attendance', [body('date').isISO8601()], validate, ctrl.unmarkAttendance);

/**
 * @swagger
 * /holidays/marked-dates:
 *   get:
 *     tags: [Holidays]
 *     summary: Check which dates from a list are already marked as HOLIDAY in attendance
 *     parameters:
 *       - in: query
 *         name: dates
 *         schema: { type: string, example: "2026-03-22,2026-12-25" }
 *         description: Comma-separated list of dates to check
 *     responses:
 *       200: { description: Array of date strings that are marked }
 */
router.get('/marked-dates', ctrl.getMarkedDates);

/**
 * @swagger
 * /holidays/{id}:
 *   delete:
 *     tags: [Holidays]
 *     summary: Remove a holiday from the calendar
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Holiday removed }
 */
router.delete('/:id', ctrl.delete);

module.exports = router;
