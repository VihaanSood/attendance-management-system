// src/services/auth.service.js — Authentication business logic
'use strict';

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken, buildPayload } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

class AuthService {
  /**
   * Register a new organization/user
   */
  async register({ name, email, password, organization }) {
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('An account with this email already exists.', 409);

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name, email, organization,
        password: hashed,
        // Create default org settings automatically
        settings: { create: { workingDays: 26 } },
      },
      select: { id: true, name: true, email: true, organization: true, role: true, createdAt: true },
    });

    const tokens = this._generateTokens(user);
    return { user, ...tokens };
  }

  /**
   * Login with email + password
   */
  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Generic error message to prevent email enumeration
    if (!user) throw new AppError('Invalid email or password.', 401);
    if (!user.isActive) throw new AppError('Account is deactivated. Contact support.', 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password.', 401);

    const safeUser = {
      id: user.id, name: user.name, email: user.email,
      organization: user.organization, role: user.role,
    };
    const tokens = this._generateTokens(safeUser);
    return { user: safeUser, ...tokens };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token required.', 401);

    const decoded = verifyRefreshToken(refreshToken); // throws if invalid
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, organization: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) throw new AppError('Invalid refresh token.', 401);

    return { accessToken: signAccessToken(buildPayload(user)) };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, organization: true,
        role: true, isActive: true, createdAt: true,
        settings: true,
      },
    });
    if (!user) throw new AppError('User not found.', 404);
    return user;
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect.', 400);

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Password changed successfully.' };
  }

  // ── Private helpers ──────────────────────────────────────────────

  _generateTokens(user) {
    const payload = buildPayload(user);
    return {
      accessToken:  signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }
}

module.exports = new AuthService();
