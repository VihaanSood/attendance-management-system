// src/controllers/leave.controller.js
'use strict';

const leaveService   = require('../services/leave.service');
const { sendSuccess } = require('../utils/response');

class LeaveController {
  async create(req, res, next) {
    try {
      const leave = await leaveService.create(req.user.id, req.body);
      sendSuccess(res, { data: leave, message: 'Leave request submitted.', statusCode: 201 });
    } catch (err) { next(err); }
  }

  async findAll(req, res, next) {
    try {
      const result = await leaveService.findAll(req.user.id, req.query);
      sendSuccess(res, { data: result.requests, pagination: result.pagination });
    } catch (err) { next(err); }
  }

  async review(req, res, next) {
    try {
      const result = await leaveService.review(req.user.id, req.params.id, req.body);
      sendSuccess(res, { data: result, message: `Leave request ${result.status.toLowerCase()}.` });
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      const result = await leaveService.delete(req.user.id, req.params.id);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }
}

module.exports = new LeaveController();
