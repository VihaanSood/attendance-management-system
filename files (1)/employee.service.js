// src/services/employee.service.js — Employee CRUD business logic
'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPagination } = require('../utils/response');

class EmployeeService {
  /**
   * Create a new employee under the authenticated user's organization
   */
  async create(userId, data) {
    // Check email uniqueness within this organization
    if (data.email) {
      const conflict = await prisma.employee.findFirst({
        where: { userId, email: data.email, isActive: true },
      });
      if (conflict) throw new AppError('An employee with this email already exists in your organization.', 409);
    }

    const employee = await prisma.employee.create({
      data: {
        ...data,
        userId,
        joiningDate: new Date(data.joiningDate),
        salary: parseFloat(data.salary),
      },
    });

    return employee;
  }

  /**
   * Get all employees for the user's organization with pagination and filters
   */
  async findAll(userId, query) {
    const { page, limit, skip } = getPaginationParams(query);
    const { search, department, isActive } = query;

    const where = {
      userId,
      // Default to active employees; allow explicit filter
      isActive: isActive !== undefined ? isActive === 'true' : true,
      ...(search && {
        OR: [
          { name:       { contains: search, mode: 'insensitive' } },
          { role:       { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(department && { department: { contains: department, mode: 'insensitive' } }),
    };

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, age: true, salary: true,
          role: true, department: true, joiningDate: true,
          email: true, phone: true, isActive: true, createdAt: true,
        },
      }),
    ]);

    return { employees, pagination: buildPagination(page, limit, total) };
  }

  /**
   * Get a single employee — validates tenant ownership
   */
  async findOne(userId, employeeId) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, userId },
      include: {
        _count: { select: { attendance: true } },
      },
    });
    if (!employee) throw new AppError('Employee not found.', 404);
    return employee;
  }

  /**
   * Update employee details
   */
  async update(userId, employeeId, data) {
    await this.findOne(userId, employeeId); // Ownership check

    if (data.email) {
      const conflict = await prisma.employee.findFirst({
        where: { userId, email: data.email, NOT: { id: employeeId } },
      });
      if (conflict) throw new AppError('Another employee already has this email.', 409);
    }

    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...data,
        ...(data.joiningDate && { joiningDate: new Date(data.joiningDate) }),
        ...(data.salary !== undefined && { salary: parseFloat(data.salary) }),
      },
    });
  }

  /**
   * Soft-delete (deactivate) an employee
   */
  async delete(userId, employeeId) {
    await this.findOne(userId, employeeId);
    await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive: false },
    });
    return { message: 'Employee deactivated successfully.' };
  }

  /**
   * Permanently delete (hard delete) — admin only
   */
  async hardDelete(userId, employeeId) {
    await this.findOne(userId, employeeId);
    await prisma.employee.delete({ where: { id: employeeId } });
    return { message: 'Employee permanently deleted.' };
  }

  /**
   * Get distinct departments for this organization
   */
  async getDepartments(userId) {
    const result = await prisma.employee.findMany({
      where: { userId, isActive: true, department: { not: null } },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });
    return result.map((r) => r.department);
  }
}

module.exports = new EmployeeService();
