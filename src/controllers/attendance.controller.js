// src/controllers/attendance.controller.js
'use strict';

const attendanceService = require('../services/attendance.service');
const exportService     = require('../services/export.service');
const { sendSuccess }   = require('../utils/response');

class AttendanceController {
  async mark(req, res, next) {
    try {
      const record = await attendanceService.mark(req.user.id, req.body);
      sendSuccess(res, { data: record, message: 'Attendance marked successfully.' });
    } catch (err) { next(err); }
  }

  async bulkMark(req, res, next) {
    try {
      const result = await attendanceService.bulkMark(req.user.id, req.body);
      sendSuccess(res, { data: result, message: `Attendance marked for ${result.marked} employees.` });
    } catch (err) { next(err); }
  }

  async getEmployeeAttendance(req, res, next) {
    try {
      const result = await attendanceService.getEmployeeAttendance(
        req.user.id, req.params.employeeId, req.query
      );
      sendSuccess(res, { data: result, pagination: result.pagination });
    } catch (err) { next(err); }
  }

  async getDailyAttendance(req, res, next) {
    try {
      const { date } = req.params;
      const result = await attendanceService.getDailyAttendance(req.user.id, date, req.query);
      sendSuccess(res, { data: result, pagination: result.pagination });
    } catch (err) { next(err); }
  }

  async getMonthlySummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const result = await attendanceService.getMonthlySummary(req.user.id, month, year);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      const result = await attendanceService.delete(req.user.id, req.params.id);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async exportCsv(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;
      const file = await exportService.attendanceCsv(req.user.id, employeeId, month, year);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.content);
    } catch (err) { next(err); }
  }
}

module.exports = new AttendanceController();
