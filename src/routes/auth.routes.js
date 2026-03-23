// src/routes/auth.routes.js
'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/auth.controller');
const { authenticate, validate } = require('../middleware/auth.middleware');
const { body }   = require('express-validator');

// ── Validators ─────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/(?=.*[A-Z])(?=.*[0-9])/).withMessage('Password must contain an uppercase letter and a number.'),
  body('organization').trim().notEmpty().withMessage('Organization name is required.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

// ── Routes ─────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user account management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new organization account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, organization]
 *             properties:
 *               name:         { type: string, example: "Jane Doe" }
 *               email:        { type: string, format: email, example: "jane@corp.com" }
 *               password:     { type: string, minLength: 8, example: "Secret@123" }
 *               organization: { type: string, example: "Acme Corp" }
 *     responses:
 *       201:
 *         description: Account created — returns user info and JWT tokens
 *       400: { description: Validation error }
 *       409: { description: Email already registered }
 */
router.post('/register', registerRules, validate, ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: "jane@corp.com" }
 *               password: { type: string, example: "Secret@123" }
 *     responses:
 *       200: { description: Login successful — returns accessToken + refreshToken }
 *       401: { description: Invalid credentials }
 */
router.post('/login', loginRules, validate, ctrl.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh', ctrl.refreshToken);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user's profile
 *     responses:
 *       200: { description: User profile with org settings }
 *       401: { description: Unauthorized }
 */
router.get('/me', authenticate, ctrl.getProfile);

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change password for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed successfully }
 *       400: { description: Current password incorrect }
 */
router.patch('/change-password', authenticate, changePasswordRules, validate, ctrl.changePassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (client should discard JWT)
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
