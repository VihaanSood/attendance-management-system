// src/middleware/auth.middleware.js — JWT authentication & role-based access
'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../config/database');
const { AppError } = require('./errorHandler');

/**
 * authenticate — Validates JWT and attaches user to req.user
 * Every protected route uses this middleware.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token); // throws if invalid/expired

    // Fetch fresh user from DB to ensure account is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, name: true, email: true,
        organization: true, role: true, isActive: true,
      },
    });

    if (!user) throw new AppError('User no longer exists.', 401);
    if (!user.isActive) throw new AppError('Account is deactivated. Contact support.', 403);

    req.user = user; // Attach user to request for downstream use
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authorize — Role-based access control
 * Usage: authorize('ADMIN', 'SUPER_ADMIN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated.', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Validate request body using express-validator results
 */
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const { AppError } = require('./errorHandler');
    return next(new AppError('Validation failed', 422, errors.array()));
  }
  next();
};

module.exports = { authenticate, authorize, validate };
