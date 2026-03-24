// scripts/start.js — Production entry point
// Runs Prisma migrations then starts the Express server
'use strict';

const { execSync } = require('child_process');

console.log('🔄 Running database migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations complete');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}

console.log('🔄 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client ready');
} catch (err) {
  console.error('❌ Prisma generate failed:', err.message);
  process.exit(1);
}

console.log('🚀 Starting server...');
require('./src/server.js');
