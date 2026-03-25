// scripts/start.js — Production entry point
// Runs Prisma migrations then starts the Express server
'use strict';

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running database migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Migrations complete');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}

console.log('🔄 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Prisma client ready');
} catch (err) {
  console.error('❌ Prisma generate failed:', err.message);
  process.exit(1);
}

console.log('🚀 Starting server...');
// __dirname is scripts/, so go up one level to reach src/server.js
require(path.join(__dirname, '..', 'src', 'server.js'));
