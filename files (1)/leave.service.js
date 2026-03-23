// src/services/leave.service.js — Leave request management
'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPagination } = require('../utils/response');

class LeaveService {
  /**
   * Submit a leave request for an employee
   */
  async create(userId, { employeeId, startDate, endDate, type, reason }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, userId, isActive: true },
    });
    if (!employee) throw new AppError('Employee not found.', 404);

    const start = new Date(startDate);
    const end   = new Date(endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    if (end < start) throw new AppError('End date cannot be before start date.', 400);

    // Check for overlapping leave requests
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: end },   endDate: { gte: start } },
        ],
      },
    });
    if (overlap) throw new AppError('A leave request already exists for this date range.', 409);

    return prisma.leaveRequest.create({
      data: { employeeId, userId, startDate: start, endDate: end, type, reason },
      include: { employee: { select: { name: true, role: true } } },
    });
  }

  /**
   * List leave requests for the organization with filters
   */
  async findAll(userId, query) {
    const { page, limit, skip } = getPaginationParams(query);
    const { status, employeeId, type } = query;

    const where = {
      userId,
      ...(status     && { status }),
      ...(employeeId && { employeeId }),
      ...(type       && { type }),
    };

    const [total, requests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { id: true, name: true, role: true, department: true } } },
      }),
    ]);

    return { requests, pagination: buildPagination(page, limit, total) };
  }

  /**
   * Approve or reject a leave request
   */
  async review(userId, leaveId, { status }) {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id: leaveId, userId },
    });
    if (!leave) throw new AppError('Leave request not found.', 404);
    if (leave.status !== 'PENDING') {
      throw new AppError(`Leave request has already been ${leave.status.toLowerCase()}.`, 400);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status, reviewedAt: new Date() },
      include: { employee: { select: { name: true } } },
    });

    // If approved, auto-mark attendance as LEAVE for each date in range
    if (status === 'APPROVED') {
      await this._markLeaveAttendance(userId, leave);
    }

    return updated;
  }

  /**
   * Delete / cancel a pending leave request
   */
  async delete(userId, leaveId) {
    const leave = await prisma.leaveRequest.findFirst({ where: { id: leaveId, userId } });
    if (!leave) throw new AppError('Leave request not found.', 404);
    if (leave.status === 'APPROVED') throw new AppError('Cannot cancel an approved leave.', 400);
    await prisma.leaveRequest.delete({ where: { id: leaveId } });
    return { message: 'Leave request cancelled.' };
  }

  // ── Private helpers ───────────────────────────────────────────────

  async _markLeaveAttendance(userId, leave) {
    const dates = [];
    const cursor = new Date(leave.startDate);
    const end    = new Date(leave.endDate);

    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    await prisma.$transaction(
      dates.map((date) =>
        prisma.attendance.upsert({
          where:  { employeeId_date: { employeeId: leave.employeeId, date } },
          update: { status: 'LEAVE' },
          create: { employeeId: leave.employeeId, userId, date, status: 'LEAVE' },
        })
      )
    );
  }
}

module.exports = new LeaveService();
