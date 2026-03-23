// src/routes/dashboard.routes.js
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/dashboard.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { query } = require('express-validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and overview data
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get full dashboard overview for current month
 *     description: Returns employee stats, today's attendance, monthly breakdown, payroll estimate, and pending leaves.
 *     responses:
 *       200: { description: Dashboard data }
 */
router.get('/', ctrl.getOverview);

/**
 * @swagger
 * /dashboard/trend:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get daily attendance trend for a month (chart data)
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
 *       200: { description: Array of daily attendance counts }
 */
router.get('/trend',
  [query('month').isInt({ min: 1, max: 12 }), query('year').isInt()],
  validate,
  ctrl.getMonthlyTrend
);

module.exports = router;
