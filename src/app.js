// src/app.js — Express application setup and middleware registration
'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { swaggerSpec, swaggerUi } = require('./config/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logger, morganStream } = require('./utils/logger');

// ── Route Imports ─────────────────────────────────────────────────
const authRoutes       = require('./routes/auth.routes');
const employeeRoutes   = require('./routes/employee.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const salaryRoutes     = require('./routes/salary.routes');
const leaveRoutes      = require('./routes/leave.routes');
const holidayRoutes    = require('./routes/holiday.routes');
const dashboardRoutes  = require('./routes/dashboard.routes');
const settingsRoutes   = require('./routes/settings.routes');

const app = express();

// ── Security Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { success: false, message: 'Too many authentication attempts.' },
});

app.use('/api', limiter);

// ── General Middleware ───────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: morganStream }));

// ── API Documentation ────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Attendance System API',
  customCss: '.swagger-ui .topbar { background-color: #1e293b; }',
}));

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Attendance Management System API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ───────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,       authLimiter, authRoutes);
app.use(`${API}/employees`,  employeeRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/salary`,     salaryRoutes);
app.use(`${API}/leaves`,     leaveRoutes);
app.use(`${API}/holidays`,   holidayRoutes);
app.use(`${API}/dashboard`,  dashboardRoutes);
app.use(`${API}/settings`,   settingsRoutes);

// ── Error Handlers (must be last) ────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
