// src/services/salary.service.js — Salary calculation engine
'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getMonthRange } = require('../utils/dateUtils');

class SalaryService {
  /**
   * Calculate salary for a single employee in a given month
   *
   * Formula:
   *   salary_per_day  = monthly_salary / configured_working_days
   *   effective_days  = present_days + (half_day_count * 0.5)
   *   final_salary    = effective_days * salary_per_day
   */
  async calculateForEmployee(userId, employeeId, month, year) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, userId },
      select: { id: true, name: true, role: true, salary: true, joiningDate: true },
    });
    if (!employee) throw new AppError('Employee not found.', 404);

    const settings = await this._getSettings(userId);
    const range    = getMonthRange(parseInt(year), parseInt(month));

    // Fetch all attendance for this employee in the month
    const records = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: range.start, lte: range.end } },
      select: { status: true, date: true },
    });

    const counts = this._countStatuses(records);
    const calc   = this._compute(Number(employee.salary), counts, settings.workingDays);

    return {
      employee: {
        id:   employee.id,
        name: employee.name,
        role: employee.role,
      },
      period: { month: parseInt(month), year: parseInt(year) },
      monthlySalary:       Number(employee.salary),
      configuredWorkDays:  settings.workingDays,
      attendance:          counts,
      ...calc,
    };
  }

  /**
   * Calculate salary for ALL employees — returns a full payroll report
   */
  async calculatePayroll(userId, month, year) {
    const employees = await prisma.employee.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, role: true, department: true, salary: true },
      orderBy: { name: 'asc' },
    });

    const settings = await this._getSettings(userId);
    const range    = getMonthRange(parseInt(year), parseInt(month));

    // Fetch all attendance for this org in one query (efficient)
    const allAttendance = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: range.start, lte: range.end },
      },
      select: { employeeId: true, status: true },
    });

    // Group attendance by employee
    const byEmployee = {};
    allAttendance.forEach(({ employeeId, status }) => {
      if (!byEmployee[employeeId]) byEmployee[employeeId] = [];
      byEmployee[employeeId].push({ status });
    });

    let totalPayroll = 0;

    const payroll = employees.map((emp) => {
      const records = byEmployee[emp.id] || [];
      const counts  = this._countStatuses(records);
      const calc    = this._compute(Number(emp.salary), counts, settings.workingDays);

      totalPayroll += calc.finalSalary;

      return {
        employeeId:   emp.id,
        name:         emp.name,
        role:         emp.role,
        department:   emp.department,
        monthlySalary: Number(emp.salary),
        attendance:   counts,
        ...calc,
      };
    });

    return {
      period:             { month: parseInt(month), year: parseInt(year) },
      configuredWorkDays: settings.workingDays,
      totalEmployees:     employees.length,
      totalPayroll:       parseFloat(totalPayroll.toFixed(2)),
      currency:           settings.currency,
      payroll,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────

  /** Count attendance by status */
  _countStatuses(records) {
    const counts = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0, HOLIDAY: 0 };
    records.forEach(({ status }) => { counts[status] = (counts[status] || 0) + 1; });
    return counts;
  }

  /**
   * Core salary computation
   * Half days count as 0.5 working days
   */
  _compute(monthlySalary, counts, workingDays) {
    const salaryPerDay    = monthlySalary / workingDays;
    const effectiveDays   = counts.PRESENT + counts.HALF_DAY * 0.5;
    const deductionDays   = counts.ABSENT;
    const finalSalary     = parseFloat((effectiveDays * salaryPerDay).toFixed(2));
    const deductionAmount = parseFloat((deductionDays * salaryPerDay).toFixed(2));

    return {
      salaryPerDay:     parseFloat(salaryPerDay.toFixed(4)),
      effectiveDays,
      deductionDays,
      deductionAmount,
      finalSalary,
    };
  }

  /** Get org settings with defaults */
  async _getSettings(userId) {
    const settings = await prisma.orgSettings.findUnique({ where: { userId } });
    return settings || { workingDays: 26, currency: 'USD' };
  }
}

module.exports = new SalaryService();
