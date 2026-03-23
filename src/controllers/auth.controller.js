// src/controllers/auth.controller.js
'use strict';

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, { data: result, message: 'Account created successfully.', statusCode: 201 });
    } catch (err) { next(err); }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, { data: result, message: 'Login successful.' });
    } catch (err) { next(err); }
  }

  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      sendSuccess(res, { data: result, message: 'Token refreshed.' });
    } catch (err) { next(err); }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      sendSuccess(res, { data: profile });
    } catch (err) { next(err); }
  }

  async changePassword(req, res, next) {
    try {
      const result = await authService.changePassword(req.user.id, req.body);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async logout(req, res) {
    // Stateless JWT — client discards token; no server-side action needed
    sendSuccess(res, { message: 'Logged out successfully.' });
  }
}

module.exports = new AuthController();
