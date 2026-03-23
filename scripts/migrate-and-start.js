// scripts/migrate-and-start.js
const { execSync } = require('child_process')

console.log('Running database migrations...')
execSync('npx prisma migrate deploy', { stdio: 'inherit' })

console.log('Generating Prisma client...')
execSync('npx prisma generate', { stdio: 'inherit' })

console.log('Starting server...')
require('./src/server.js')