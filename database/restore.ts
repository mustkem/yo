import { Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * Enterprise Database Restore Utility
 *
 * Features:
 * - Restore from SQL backup files
 * - Support for compressed backups (.sql.gz)
 * - Safety checks and confirmations
 * - Pre-restore backup
 * - Validation after restore
 *
 * Usage:
 * - npm run db:restore -- --file=backup-xxx.sql
 * - npm run db:restore -- --file=backup-xxx.sql.gz
 * - npm run db:restore -- --latest
 */

const logger = new Logger('DBRestore');

interface RestoreOptions {
  filepath?: string;
  latest?: boolean;
  skipBackup?: boolean;
  skipConfirmation?: boolean;
}

export const restoreDatabase = async (options: RestoreOptions = {}) => {
  try {
    const { filepath, latest, skipBackup, skipConfirmation } = options;

    // Environment variables
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_DATABASE_NAME || 'twitter';

    // Safety check
    if (!dbName) {
      throw new Error('DB_DATABASE_NAME environment variable is required');
    }

    // Get backup file path
    let backupFile: string;
    if (latest) {
      backupFile = await getLatestBackup();
    } else if (filepath) {
      backupFile = filepath;
      if (!path.isAbsolute(backupFile)) {
        backupFile = path.join(__dirname, 'backups', backupFile);
      }
    } else {
      throw new Error('Either --file or --latest must be specified');
    }

    // Validate backup file exists
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    logger.log('🔍 Restore Information:');
    logger.log(`Database: ${dbName}`);
    logger.log(`Host: ${dbHost}:${dbPort}`);
    logger.log(`Backup file: ${backupFile}`);

    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    logger.log(`File size: ${fileSizeMB} MB`);

    // Production safety check
    if (
      process.env.NODE_ENV === 'production' &&
      !skipConfirmation
    ) {
      logger.warn('⚠️  PRODUCTION ENVIRONMENT DETECTED');
      logger.warn('⚠️  THIS WILL REPLACE YOUR ENTIRE DATABASE!');

      const confirmed = await promptUser(
        '\nType "yes" to confirm restore: ',
      );
      if (confirmed.toLowerCase() !== 'yes') {
        logger.log('❌ Restore cancelled by user');
        return;
      }
    }

    // Create pre-restore backup (unless explicitly skipped)
    if (!skipBackup) {
      logger.log('📦 Creating pre-restore backup...');
      const { createBackup } = await import('./backup');
      await createBackup({ name: 'pre-restore' });
      logger.log('✅ Pre-restore backup created');
    }

    // Detect if file is compressed
    const isCompressed = backupFile.endsWith('.gz');

    logger.log('🚀 Starting database restore...');
    const startTime = Date.now();

    // Build restore command
    let restoreCommand: string;
    if (isCompressed) {
      // Decompress and pipe to mysql
      restoreCommand = [
        'gunzip < ' + backupFile,
        '|',
        'mysql',
        `-h${dbHost}`,
        `-P${dbPort}`,
        `-u${dbUser}`,
        dbPassword ? `-p${dbPassword}` : '',
        dbName,
      ]
        .filter(Boolean)
        .join(' ');
    } else {
      // Direct restore
      restoreCommand = [
        'mysql',
        `-h${dbHost}`,
        `-P${dbPort}`,
        `-u${dbUser}`,
        dbPassword ? `-p${dbPassword}` : '',
        dbName,
        '<',
        backupFile,
      ]
        .filter(Boolean)
        .join(' ');
    }

    // Execute restore
    execSync(restoreCommand, { stdio: 'inherit' });
    const duration = Date.now() - startTime;

    logger.log(`✅ Restore completed in ${duration}ms`);

    // Validate restore
    logger.log('🔍 Validating restored database...');
    await validateRestore(dbHost, dbPort, dbUser, dbPassword, dbName);
    logger.log('✅ Database validated successfully');

    return {
      success: true,
      duration,
      backupFile,
    };
  } catch (error) {
    logger.error('❌ Restore failed:', error.message);
    logger.error(error.stack);
    logger.error(
      '\n⚠️  Database may be in an inconsistent state. Consider restoring from pre-restore backup.',
    );
    throw error;
  }
};

/**
 * Gets the most recent backup file
 */
async function getLatestBackup(): Promise<string> {
  const backupDir = path.join(__dirname, 'backups');

  if (!fs.existsSync(backupDir)) {
    throw new Error('No backups directory found');
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map((file) => ({
      name: file,
      path: path.join(backupDir, file),
      mtime: fs.statSync(path.join(backupDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    throw new Error('No backup files found');
  }

  logger.log(`📦 Latest backup: ${files[0].name}`);
  return files[0].path;
}

/**
 * Validates the restored database
 */
async function validateRestore(
  host: string,
  port: string,
  user: string,
  password: string,
  database: string,
): Promise<void> {
  // Check database exists
  const checkDbCommand = [
    'mysql',
    `-h${host}`,
    `-P${port}`,
    `-u${user}`,
    password ? `-p${password}` : '',
    '-e',
    `"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${database}'"`,
  ]
    .filter(Boolean)
    .join(' ');

  execSync(checkDbCommand, { stdio: 'pipe' });

  // Check tables exist
  const checkTablesCommand = [
    'mysql',
    `-h${host}`,
    `-P${port}`,
    `-u${user}`,
    password ? `-p${password}` : '',
    database,
    '-e',
    '"SHOW TABLES"',
  ]
    .filter(Boolean)
    .join(' ');

  const tables = execSync(checkTablesCommand, { encoding: 'utf-8' });

  if (!tables || tables.trim().split('\n').length < 2) {
    throw new Error('No tables found in restored database');
  }

  logger.log(`✅ Found ${tables.trim().split('\n').length - 1} tables`);
}

/**
 * Prompts user for input
 */
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Lists available backups for restore
 */
export async function listAvailableBackups(): Promise<void> {
  const backupDir = path.join(__dirname, 'backups');

  if (!fs.existsSync(backupDir)) {
    logger.log('📁 No backups directory found');
    return;
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map((file) => {
      const filepath = path.join(backupDir, file);
      const stats = fs.statSync(filepath);
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: new Date(stats.mtimeMs).toLocaleString(),
        daysAgo: Math.floor(
          (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24),
        ),
      };
    })
    .sort((a, b) => a.daysAgo - b.daysAgo);

  if (files.length === 0) {
    logger.log('📁 No backups found');
    return;
  }

  logger.log('\n=== AVAILABLE BACKUPS FOR RESTORE ===\n');
  console.table(files);
  logger.log(`\nTo restore, use: npm run db:restore -- --file=<filename>`);
  logger.log(`Or restore latest: npm run db:restore -- --latest`);
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => arg.startsWith('--file='));
  const filepath = fileArg ? fileArg.split('=')[1] : undefined;
  const latest = args.includes('--latest');
  const skipBackup = args.includes('--skip-backup');
  const skipConfirmation = args.includes('--skip-confirmation');
  const list = args.includes('--list');

  if (list) {
    listAvailableBackups().catch((error) => {
      logger.error('Failed to list backups:', error);
      process.exit(1);
    });
  } else {
    restoreDatabase({ filepath, latest, skipBackup, skipConfirmation })
      .then(() => {
        logger.log('✅ Restore completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('❌ Restore failed:', error);
        process.exit(1);
      });
  }
}
