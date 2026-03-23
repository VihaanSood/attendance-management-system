// src/utils/response.js — Standardized API response helpers
'use strict';

/**
 * Send a successful response
 */
const sendSuccess = (res, { data = null, message = 'Success', statusCode = 200, pagination = null } = {}) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
const sendError = (res, { message = 'An error occurred', statusCode = 500, errors = null } = {}) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Build pagination metadata from query params
 */
const getPaginationParams = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(
    parseInt(process.env.MAX_PAGE_SIZE) || 100,
    Math.max(1, parseInt(query.limit) || parseInt(process.env.DEFAULT_PAGE_SIZE) || 10)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination response metadata
 */
const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

module.exports = { sendSuccess, sendError, getPaginationParams, buildPagination };
