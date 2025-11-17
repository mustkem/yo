#!/usr/bin/env node

const args = process.argv.slice(2);

// Default folder if user does NOT provide a name
const name = args[0] || 'NewMigration';

const { execSync } = require('child_process');

const command = `npm run typeorm migration:generate -- database/migrations/${name} -d apps/api-gateway/src/modules/commons/data-source.ts`;

console.log('Running:', command);
execSync(command, { stdio: 'inherit' });

// yarn migration:generate AddEmailInUserTable
