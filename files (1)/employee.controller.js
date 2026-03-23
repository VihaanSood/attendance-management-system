// src/controllers/employee.controller.js
'use strict';

const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/response');

class EmployeeController {
  async create(req, res, next) {
    try {
      const employee = await employeeService.create(req.user.id, req.body);
      sendSuccess(res, { data: employee, message: 'Employee created successfully.', statusCode: 201 });
    } catch (err) { next(err); }
  }

  async findAll(req, res, next) {
    try {
      const result = await employeeService.findAll(req.user.id, req.query);
      sendSuccess(res, { data: result.employees, pagination: result.pagination });
    } catch (err) { next(err); }
  }

  async findOne(req, res, next) {
    try {
      const employee = await employeeService.findOne(req.user.id, req.params.id);
      sendSuccess(res, { data: employee });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const employee = await employeeService.update(req.user.id, req.params.id, req.body);
      sendSuccess(res, { data: employee, message: 'Employee updated successfully.' });
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      const result = await employeeService.delete(req.user.id, req.params.id);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async hardDelete(req, res, next) {
    try {
      const result = await employeeService.hardDelete(req.user.id, req.params.id);
      sendSuccess(res, { data: result });
    } catch (err) { next(err); }
  }

  async getDepartments(req, res, next) {
    try {
      const departments = await employeeService.getDepartments(req.user.id);
      sendSuccess(res, { data: departments });
    } catch (err) { next(err); }
  }
}

module.exports = new EmployeeController();
