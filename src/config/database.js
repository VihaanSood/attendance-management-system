// src/config/database.js — Prisma client singleton
'use strict';

const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

// Singleton pattern — reuse the same Prisma instance
let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['error'],
    });

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        if (e.duration > 100) {
          logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }
  return prisma;
}

async function connectDatabase() {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

module.exports = {
  prisma: getPrismaClient(),
  connectDatabase,
  disconnectDatabase,
};
