// src/services/dashboard.service.js — Analytics and summary data
'use strict';

const { prisma } = require('../config/database');
const { getMonthRange, getCurrentMonthYear } = require('../utils/dateUtils');
const salaryService = require('./salary.service');

class DashboardService {
  /**
   * Comprehensive dashboard overview for the current month
   */
  async getOverview(userId) {
    const { month, year } = getCurrentMonthYear();
    const range = getMonthRange(year, month);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Run all queries in parallel for performance
    const [
      totalEmployees,
      newThisMonth,
      todayAttendance,
      monthAttendance,
      departments,
      recentLeaves,
    ] = await Promise.all([
      // Total active employees
      prisma.employee.count({ where: { userId, isActive: true } }),

      // Employees who joined this month
      prisma.employee.count({
        where: { userId, joiningDate: { gte: range.start, lte: range.end } },
      }),

      // Today's attendance breakdown
      prisma.attendance.groupBy({
        by: ['status'],
        where: { userId, date: today },
        _count: { status: true },
      }),

      // This month's attendance breakdown
      prisma.attendance.groupBy({
        by: ['status'],
        where: { userId, date: { gte: range.start, lte: range.end } },
        _count: { status: true },
      }),

      // Department distribution
      prisma.employee.groupBy({
        by: ['department'],
        where: { userId, isActive: true, department: { not: null } },
        _count: { department: true },
        orderBy: { _count: { department: 'desc' } },
      }),

      // Recent pending leave requests
      prisma.leaveRequest.findMany({
        where: { userId, status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { name: true, role: true } } },
      }),
    ]);

    // Normalize attendance counts
    const normalize = (arr) => {
      const map = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0, HOLIDAY: 0 };
      arr.forEach(({ status, _count }) => { map[status] = _count.status; });
      return map;
    };

    const todayCounts = normalize(todayAttendance);
    const monthCounts = normalize(monthAttendance);

    // Quick payroll estimate (uses salary service)
    let payrollEstimate = null;
    try {
      const payroll = await salaryService.calculatePayroll(userId, month, year);
      payrollEstimate = {
        totalPayroll: payroll.totalPayroll,
        currency: payroll.currency,
      };
    } catch (_) { /* non-fatal */ }

    return {
      period: { month, year },
      employees: {
        total:      totalEmployees,
        newThisMonth,
        departments: departments.map((d) => ({
          name:  d.department,
          count: d._count.department,
        })),
      },
      today: {
        date:   today.toISOString().split('T')[0],
        ...todayCounts,
        notMarked: Math.max(0, totalEmployees - Object.values(todayCounts).reduce((a, b) => a + b, 0)),
      },
      thisMonth: monthCounts,
      payrollEstimate,
      pendingLeaves: recentLeaves,
    };
  }

  /**
   * Monthly trend — attendance counts per day for a given month
   */
  async getMonthlyTrend(userId, month, year) {
    const range = getMonthRange(parseInt(year), parseInt(month));

    const records = await prisma.attendance.findMany({
      where: { userId, date: { gte: range.start, lte: range.end } },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const byDate = {};
    records.forEach(({ date, status }) => {
      const key = date.toISOString().split('T')[0];
      if (!byDate[key]) byDate[key] = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0, HOLIDAY: 0 };
      byDate[key][status] = (byDate[key][status] || 0) + 1;
    });

    return Object.entries(byDate).map(([date, counts]) => ({ date, ...counts }));
  }
}

module.exports = new DashboardService();
