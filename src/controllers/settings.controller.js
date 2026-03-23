// src/controllers/settings.controller.js
'use strict';

const { prisma }     = require('../config/database');
const { sendSuccess } = require('../utils/response');
const { AppError }   = require('../middleware/errorHandler');

class SettingsController {
  async get(req, res, next) {
    try {
      const settings = await prisma.orgSettings.findUnique({
        where: { userId: req.user.id },
      });
      if (!settings) throw new AppError('Settings not found.', 404);
      sendSuccess(res, { data: settings });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const settings = await prisma.orgSettings.upsert({
        where: { userId: req.user.id },
        update: req.body,
        create: { userId: req.user.id, ...req.body },
      });
      sendSuccess(res, { data: settings, message: 'Settings updated.' });
    } catch (err) { next(err); }
  }
}

module.exports = new SettingsController();
