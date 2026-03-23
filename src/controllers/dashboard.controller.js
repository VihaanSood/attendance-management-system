// src/controllers/dashboard.controller.js
'use strict';

const dashboardService = require('../services/dashboard.service');
const { sendSuccess }   = require('../utils/response');

class DashboardController {
  async getOverview(req, res, next) {
    try {
      const data = await dashboardService.getOverview(req.user.id);
      sendSuccess(res, { data });
    } catch (err) { next(err); }
  }

  async getMonthlyTrend(req, res, next) {
    try {
      const { month, year } = req.query;
      const data = await dashboardService.getMonthlyTrend(req.user.id, month, year);
      sendSuccess(res, { data });
    } catch (err) { next(err); }
  }
}

module.exports = new DashboardController();
