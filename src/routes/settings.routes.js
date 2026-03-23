// src/routes/settings.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/settings.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Organization configuration
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get organization settings
 *     responses:
 *       200: { description: Current org settings }
 *   put:
 *     tags: [Settings]
 *     summary: Update organization settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workingDays: { type: integer, example: 26, description: "Days used for salary calculation" }
 *               currency:    { type: string, example: "USD" }
 *               timezone:    { type: string, example: "America/New_York" }
 *     responses:
 *       200: { description: Settings updated }
 */
router.get('/',  ctrl.get);
router.put('/',
  [body('workingDays').optional().isInt({ min: 1, max: 31 })],
  validate,
  ctrl.update
);

module.exports = router;
