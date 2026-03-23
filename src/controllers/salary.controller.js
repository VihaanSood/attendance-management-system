// src/controllers/salary.controller.js
'use strict';

const salaryService  = require('../services/salary.service');
const exportService  = require('../services/export.service');
const { sendSuccess } = require('../utils/response');

class SalaryController {
  async calculateEmployee(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;
      const result = await salaryService.calculateForEmployee(req.user.id, employeeId, month, year);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async calculatePayroll(req, res, next) {
    try {
      const { month, year } = req.query;
      const result = await salaryService.calculatePayroll(req.user.id, month, year);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async exportCsv(req, res, next) {
    try {
      const { month, year } = req.query;
      const file = await exportService.payrollCsv(req.user.id, month, year);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.content);
    } catch (err) { next(err); }
  }

  async exportPdf(req, res, next) {
    try {
      const { month, year } = req.query;
      const file = await exportService.payrollPdf(req.user.id, month, year);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.content);
    } catch (err) { next(err); }
  }
}

module.exports = new SalaryController();
