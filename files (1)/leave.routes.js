// src/routes/leave.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/leave.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');

router.use(authenticate);

const createRules = [
  body('employeeId').notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('type').isIn(['SICK', 'CASUAL', 'ANNUAL', 'UNPAID', 'OTHER']),
  body('reason').trim().notEmpty(),
];

const reviewRules = [
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED.'),
];

/**
 * @swagger
 * tags:
 *   name: Leaves
 *   description: Leave request management
 */

/**
 * @swagger
 * /leaves:
 *   get:
 *     tags: [Leaves]
 *     summary: List all leave requests with filters
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED] }
 *       - in: query
 *         name: employeeId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [SICK, CASUAL, ANNUAL, UNPAID, OTHER] }
 *     responses:
 *       200: { description: Paginated leave requests }
 *   post:
 *     tags: [Leaves]
 *     summary: Submit a new leave request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, startDate, endDate, type, reason]
 *             properties:
 *               employeeId: { type: string }
 *               startDate:  { type: string, format: date }
 *               endDate:    { type: string, format: date }
 *               type:       { type: string, enum: [SICK, CASUAL, ANNUAL, UNPAID, OTHER] }
 *               reason:     { type: string }
 *     responses:
 *       201: { description: Leave request submitted }
 *       409: { description: Overlapping leave request exists }
 */
router.get('/',    ctrl.findAll);
router.post('/',   createRules, validate, ctrl.create);

/**
 * @swagger
 * /leaves/{id}/review:
 *   patch:
 *     tags: [Leaves]
 *     summary: Approve or reject a leave request
 *     description: If approved, attendance is automatically marked as LEAVE for each date.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [APPROVED, REJECTED] }
 *     responses:
 *       200: { description: Leave reviewed }
 *       400: { description: Already reviewed }
 */
router.patch('/:id/review', reviewRules, validate, ctrl.review);

/**
 * @swagger
 * /leaves/{id}:
 *   delete:
 *     tags: [Leaves]
 *     summary: Cancel a pending leave request
 *     responses:
 *       200: { description: Leave cancelled }
 *       400: { description: Cannot cancel approved leave }
 */
router.delete('/:id', ctrl.delete);

module.exports = router;
