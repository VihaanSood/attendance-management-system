// src/controllers/holiday.controller.js
'use strict';

const holidayService  = require('../services/holiday.service');
const { sendSuccess }  = require('../utils/response');

class HolidayController {
  async create(req, res, next) {
    try {
      const holiday = await holidayService.create(req.user.id, req.body);
      sendSuccess(res, { data: holiday, message: 'Holiday added.', statusCode: 201 });
    } catch (err) { next(err); }
  }

  async findAll(req, res, next) {
    try {
      const holidays = await holidayService.findAll(req.user.id, req.query);
      sendSuccess(res, { data: holidays });
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      const result = await holidayService.delete(req.user.id, req.params.id);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async markAttendance(req, res, next) {
    try {
      const result = await holidayService.markHolidayAttendance(req.user.id, req.body.date);
      sendSuccess(res, { data: result, message: `Holiday attendance marked for ${result.marked} employees.` });
    } catch (err) { next(err); }
  }

  async unmarkAttendance(req, res, next) {
    try {
      const result = await holidayService.unmarkHolidayAttendance(req.user.id, req.body.date);
      sendSuccess(res, { data: result, message: `Holiday attendance removed for ${result.unmarked} employees.` });
    } catch (err) { next(err); }
  }

  async getMarkedDates(req, res, next) {
    try {
      // dates comes as a comma-separated query param: ?dates=2026-03-22,2026-04-14
      const dates = (req.query.dates || '').split(',').filter(Boolean);
      const markedDates = await holidayService.getMarkedDates(req.user.id, dates);
      sendSuccess(res, { data: markedDates });
    } catch (err) { next(err); }
  }
}

module.exports = new HolidayController();
