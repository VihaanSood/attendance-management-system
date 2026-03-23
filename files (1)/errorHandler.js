// src/middleware/errorHandler.js — Global error handling middleware
'use strict';

const { logger } = require('../utils/logger');

/**
 * Custom application error class with HTTP status code support
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 handler — mounted before the global error handler
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Global error handler — Express 4-argument error middleware
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let { statusCode = 500, message, errors } = err;

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.join(', ') || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // Validation errors (express-validator)
  if (err.name === 'ValidationError') {
    statusCode = 422;
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = { AppError, notFoundHandler, errorHandler };
