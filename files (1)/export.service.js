// src/services/export.service.js — CSV and PDF report generation
'use strict';

const { createObjectCsvStringifier } = require('csv-writer');
const PDFDocument = require('pdfkit');
const salaryService = require('./salary.service');
const attendanceService = require('./attendance.service');

class ExportService {
  /**
   * Export monthly payroll report as CSV
   */
  async payrollCsv(userId, month, year) {
    const data = await salaryService.calculatePayroll(userId, month, year);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name',          title: 'Employee Name' },
        { id: 'role',          title: 'Role' },
        { id: 'department',    title: 'Department' },
        { id: 'monthlySalary', title: 'Monthly Salary' },
        { id: 'salaryPerDay',  title: 'Salary/Day' },
        { id: 'PRESENT',       title: 'Present Days' },
        { id: 'ABSENT',        title: 'Absent Days' },
        { id: 'LEAVE',         title: 'Leave Days' },
        { id: 'HALF_DAY',      title: 'Half Days' },
        { id: 'effectiveDays', title: 'Effective Days' },
        { id: 'finalSalary',   title: 'Final Salary' },
        { id: 'currency',      title: 'Currency' },
      ],
    });

    const records = data.payroll.map((p) => ({
      ...p,
      ...p.attendance,
      currency: data.currency,
    }));

    const header = csvStringifier.getHeaderString();
    const body   = csvStringifier.stringifyRecords(records);

    return {
      content:  header + body,
      filename: `payroll_${year}_${String(month).padStart(2, '0')}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export employee attendance report as CSV
   */
  async attendanceCsv(userId, employeeId, month, year) {
    const data = await attendanceService.getEmployeeAttendance(userId, employeeId, {
      month, year, limit: '500',
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'date',   title: 'Date' },
        { id: 'status', title: 'Status' },
        { id: 'note',   title: 'Note' },
      ],
    });

    const records = data.records.map((r) => ({
      date:   r.date.toISOString().split('T')[0],
      status: r.status,
      note:   r.note || '',
    }));

    const content = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    return {
      content,
      filename: `attendance_${data.employee.name.replace(/\s+/g, '_')}_${year}_${String(month).padStart(2, '0')}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export payroll report as PDF
   */
  async payrollPdf(userId, month, year) {
    const data    = await salaryService.calculatePayroll(userId, month, year);
    const doc     = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));

    // ── PDF Header ───────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold')
      .text('Payroll Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica')
      .text(`Period: ${getMonthName(month)} ${year}   |   Total Payroll: ${data.currency} ${data.totalPayroll.toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Table Headers ────────────────────────────────────────────
    const cols = [
      { label: 'Name',         x: 50,  width: 130 },
      { label: 'Role',         x: 180, width: 100 },
      { label: 'Monthly Sal', x: 280, width: 80  },
      { label: 'Present',      x: 360, width: 50  },
      { label: 'Absent',       x: 410, width: 50  },
      { label: 'Leave',        x: 460, width: 50  },
      { label: 'Effective',    x: 510, width: 60  },
      { label: 'Final Salary', x: 570, width: 100 },
    ];

    const rowH = 22;
    let y = doc.y;

    // Header row background
    doc.rect(50, y - 4, 720, rowH).fill('#1e293b');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    cols.forEach((col) => doc.text(col.label, col.x, y, { width: col.width }));
    doc.fillColor('black');
    y += rowH + 2;

    // Data rows
    data.payroll.forEach((emp, i) => {
      if (i % 2 === 0) doc.rect(50, y - 3, 720, rowH).fill('#f8fafc');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica');

      doc.text(emp.name,                                       cols[0].x, y, { width: cols[0].width });
      doc.text(emp.role,                                       cols[1].x, y, { width: cols[1].width });
      doc.text(`${data.currency} ${emp.monthlySalary}`,       cols[2].x, y, { width: cols[2].width });
      doc.text(String(emp.attendance.PRESENT),                 cols[3].x, y, { width: cols[3].width });
      doc.text(String(emp.attendance.ABSENT),                  cols[4].x, y, { width: cols[4].width });
      doc.text(String(emp.attendance.LEAVE),                   cols[5].x, y, { width: cols[5].width });
      doc.text(String(emp.effectiveDays),                      cols[6].x, y, { width: cols[6].width });
      doc.text(`${data.currency} ${emp.finalSalary}`,         cols[7].x, y, { width: cols[7].width });

      y += rowH;
      if (y > 520) { doc.addPage({ layout: 'landscape' }); y = 50; }
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve({
          content:  Buffer.concat(buffers),
          filename: `payroll_${year}_${String(month).padStart(2, '0')}.pdf`,
          mimeType: 'application/pdf',
        });
      });
    });
  }
}

function getMonthName(m) {
  return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
}

module.exports = new ExportService();
