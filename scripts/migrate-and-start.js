// scripts/migrate-and-start.js
const { execSync } = require('child_process')

console.log('Running database migrations...')
execSync('node node_modules/prisma/build/index.js migrate deploy', { stdio: 'inherit' })


console.log('Generating Prisma client...')
execSync('node node_modules/prisma/build/index.js generate', { stdio: 'inherit' })

console.log('Starting server...')
require('../src/server.js')