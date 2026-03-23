// src/utils/dateUtils.js — Date manipulation helpers
'use strict';

const { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, parseISO, isValid } = require('date-fns');

/**
 * Get the first and last day of a given month/year
 */
const getMonthRange = (year, month) => {
  // month is 1-indexed (1=January)
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

/**
 * Count working days in a month, excluding specified days off (e.g., weekends)
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {number[]} weeklyOff - Array of day indices to skip (0=Sun, 6=Sat)
 */
const getWorkingDaysInMonth = (year, month, weeklyOff = [0, 6]) => {
  const { start, end } = getMonthRange(year, month);
  const days = eachDayOfInterval({ start, end });
  return days.filter((d) => !weeklyOff.includes(getDay(d))).length;
};

/**
 * Parse and validate a date string
 */
const parseDate = (dateStr) => {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) throw new Error(`Invalid date: ${dateStr}`);
  return parsed;
};

/**
 * Format a date to YYYY-MM-DD string
 */
const toDateString = (date) => format(date, 'yyyy-MM-dd');

/**
 * Get current month and year
 */
const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

module.exports = {
  getMonthRange,
  getWorkingDaysInMonth,
  parseDate,
  toDateString,
  getCurrentMonthYear,
};
