// src/services/attendance.service.js — Attendance business logic
'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPagination } = require('../utils/response');
const { getMonthRange, toDateString } = require('../utils/dateUtils');

class AttendanceService {
  /**
   * Mark attendance for a single employee on a specific date
   * Prevents duplicates via DB unique constraint on (employeeId, date)
   */
  async mark(userId, { employeeId, date, status, note, checkIn, checkOut }) {
    // Ownership check
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, userId, isActive: true },
    });
    if (!employee) throw new AppError('Employee not found.', 404);

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0); // Normalize to date-only

    // Upsert — update if exists, create if not
    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: attendanceDate } },
      update: {
        status,
        note: note || null,
        checkIn:  checkIn  ? new Date(checkIn)  : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
      },
      create: {
        employeeId,
        userId,
        date: attendanceDate,
        status,
        note: note || null,
        checkIn:  checkIn  ? new Date(checkIn)  : null,
        checkOut: checkOut ? new Date(checkOut) : null,
      },
    });

    return record;
  }

  /**
   * Bulk mark attendance for multiple employees at once
   */
  async bulkMark(userId, { date, records }) {
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Validate all employees belong to this user
    const employeeIds = records.map((r) => r.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, userId, isActive: true },
      select: { id: true },
    });

    const validIds = new Set(employees.map((e) => e.id));
    const invalid = employeeIds.filter((id) => !validIds.has(id));
    if (invalid.length) throw new AppError(`Invalid employee IDs: ${invalid.join(', ')}`, 400);

    // Upsert all records in a transaction
    const results = await prisma.$transaction(
      records.map(({ employeeId, status, note }) =>
        prisma.attendance.upsert({
          where: { employeeId_date: { employeeId, date: attendanceDate } },
          update: { status, note: note || null },
          create: { employeeId, userId, date: attendanceDate, status, note: note || null },
        })
      )
    );

    return { marked: results.length, date: toDateString(attendanceDate) };
  }

  /**
   * Get attendance history for a specific employee with optional month filter
   */
  async getEmployeeAttendance(userId, employeeId, query) {
    const { page, limit, skip } = getPaginationParams(query);
    const { month, year } = query;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, userId },
    });
    if (!employee) throw new AppError('Employee not found.', 404);

    const dateFilter = {};
    if (month && year) {
      const range = getMonthRange(parseInt(year), parseInt(month));
      dateFilter.gte = range.start;
      dateFilter.lte = range.end;
    }

    const where = {
      employeeId,
      ...(Object.keys(dateFilter).length && { date: dateFilter }),
    };

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
    ]);

    // Calculate summary counts
    const summary = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const counts = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0, HOLIDAY: 0 };
    summary.forEach(({ status, _count }) => { counts[status] = _count.status; });

    return {
      employee: { id: employee.id, name: employee.name },
      summary: counts,
      records,
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get attendance for ALL employees on a specific date (daily view)
   */
  async getDailyAttendance(userId, date, query) {
    const { page, limit, skip } = getPaginationParams(query);
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Get all active employees
    const [total, employees] = await Promise.all([
      prisma.employee.count({ where: { userId, isActive: true } }),
      prisma.employee.findMany({
        where: { userId, isActive: true },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          attendance: {
            where: { date: attendanceDate },
            take: 1,
          },
        },
      }),
    ]);

    const result = employees.map((emp) => ({
      employeeId:  emp.id,
      name:        emp.name,
      role:        emp.role,
      department:  emp.department,
      attendance:  emp.attendance[0] || null,
      status:      emp.attendance[0]?.status || 'NOT_MARKED',
    }));

    return {
      date: toDateString(attendanceDate),
      records: result,
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get monthly attendance summary for all employees
   */
  async getMonthlySummary(userId, month, year) {
    const range = getMonthRange(parseInt(year), parseInt(month));

    const employees = await prisma.employee.findMany({
      where: { userId, isActive: true },
      select: {
        id: true, name: true, role: true, department: true, salary: true,
        attendance: {
          where: { date: { gte: range.start, lte: range.end } },
          select: { status: true, date: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return employees.map((emp) => {
      const counts = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0, HOLIDAY: 0 };
      emp.attendance.forEach(({ status }) => { counts[status] = (counts[status] || 0) + 1; });
      return {
        employeeId:   emp.id,
        name:         emp.name,
        role:         emp.role,
        department:   emp.department,
        monthlySalary: Number(emp.salary),
        ...counts,
        totalMarked:  emp.attendance.length,
      };
    });
  }

  /**
   * Delete a specific attendance record
   */
  async delete(userId, attendanceId) {
    const record = await prisma.attendance.findFirst({
      where: { id: attendanceId, userId },
    });
    if (!record) throw new AppError('Attendance record not found.', 404);
    await prisma.attendance.delete({ where: { id: attendanceId } });
    return { message: 'Attendance record deleted.' };
  }
}

module.exports = new AttendanceService();
