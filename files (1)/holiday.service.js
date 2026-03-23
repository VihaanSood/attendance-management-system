// src/services/holiday.service.js — Holiday calendar management
'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class HolidayService {
  async create(userId, { name, date, description }) {
    const holidayDate = new Date(date);
    holidayDate.setUTCHours(0, 0, 0, 0);

    return prisma.holiday.create({
      data: { userId, name, date: holidayDate, description },
    });
  }

  async findAll(userId, query = {}) {
    const { year } = query;
    const where = { userId };

    if (year) {
      where.date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    return prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async delete(userId, holidayId) {
    const holiday = await prisma.holiday.findFirst({ where: { id: holidayId, userId } });
    if (!holiday) throw new AppError('Holiday not found.', 404);
    await prisma.holiday.delete({ where: { id: holidayId } });
    return { message: 'Holiday removed from calendar.' };
  }

  /**
   * Mark all active employees as HOLIDAY for a given date
   */
  async markHolidayAttendance(userId, date) {
    const employees = await prisma.employee.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    await prisma.$transaction(
      employees.map((emp) =>
        prisma.attendance.upsert({
          where:  { employeeId_date: { employeeId: emp.id, date: d } },
          update: { status: 'HOLIDAY' },
          create: { employeeId: emp.id, userId, date: d, status: 'HOLIDAY' },
        })
      )
    );

    return { marked: employees.length, date };
  }
}

module.exports = new HolidayService();
