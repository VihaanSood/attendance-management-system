// src/utils/jwt.js — JWT token generation and verification
'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET          = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Sign an access token with user payload
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Sign a refresh token
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
};

/**
 * Verify an access token — throws if invalid/expired
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * Build the token payload from a user object
 */
const buildPayload = (user) => ({
  id:           user.id,
  email:        user.email,
  role:         user.role,
  organization: user.organization,
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildPayload,
};
