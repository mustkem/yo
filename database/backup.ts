import { Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enterprise Database Backup Utility
 *
 * Features:
 * - Automated mysqldump backup
 * - Timestamped backup files
 * - Backup retention policy
 * - Compression support
 * - Validation after backup
 *
 * Usage:
 * - npm run db:backup
 * - npm run db:backup -- --compress
 * - npm run db:backup -- --name "pre-migration"
 */

const logger = new Logger('DBBackup');

interface BackupOptions {
  name?: string;
  compress?: boolean;
  retentionDays?: number;
}

export const createBackup = async (options: BackupOptions = {}) => {
  try {
    const {
      name = `backup-${Date.now()}`,
      compress = false,
      retentionDays = 30,
    } = options;

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

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      logger.log('📁 Created backups directory');
    }

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    const compressedFilepath = `${filepath}.gz`;

    logger.log('🚀 Starting database backup...');
    logger.log(`Database: ${dbName}`);
    logger.log(`Host: ${dbHost}:${dbPort}`);

    // Build mysqldump command
    const dumpCommand = [
      'mysqldump',
      `-h${dbHost}`,
      `-P${dbPort}`,
      `-u${dbUser}`,
      dbPassword ? `-p${dbPassword}` : '',
      '--single-transaction', // Ensure consistency
      '--routines', // Include stored procedures
      '--triggers', // Include triggers
      '--events', // Include events
      '--add-drop-table', // Add DROP TABLE statements
      '--extended-insert', // Faster inserts on restore
      '--quick', // Retrieve rows one at a time
      '--lock-tables=false', // Don't lock tables
      dbName,
      compress ? `| gzip > ${compressedFilepath}` : `> ${filepath}`,
    ]
      .filter(Boolean)
      .join(' ');

    // Execute backup
    const startTime = Date.now();
    execSync(dumpCommand, { stdio: 'inherit' });
    const duration = Date.now() - startTime;

    // Get file size
    const finalPath = compress ? compressedFilepath : filepath;
    const stats = fs.statSync(finalPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    logger.log(`✅ Backup completed in ${duration}ms`);
    logger.log(`📦 File: ${finalPath}`);
    logger.log(`💾 Size: ${fileSizeMB} MB`);

    // Validate backup
    logger.log('🔍 Validating backup...');
    await validateBackup(finalPath, compress);
    logger.log('✅ Backup validated successfully');

    // Clean up old backups
    logger.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);
    await cleanupOldBackups(backupDir, retentionDays);

    return {
      success: true,
      filepath: finalPath,
      size: fileSizeMB,
      duration,
    };
  } catch (error) {
    logger.error('❌ Backup failed:', error.message);
    logger.error(error.stack);
    throw error;
  }
};

/**
 * Validates a backup file
 */
async function validateBackup(
  filepath: string,
  compressed: boolean,
): Promise<void> {
  // Check file exists
  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file not found: ${filepath}`);
  }

  // Check file size (should be > 1KB)
  const stats = fs.statSync(filepath);
  if (stats.size < 1024) {
    throw new Error(`Backup file is too small: ${stats.size} bytes`);
  }

  // For compressed files, check gzip header
  if (compressed) {
    const buffer = Buffer.alloc(2);
    const fd = fs.openSync(filepath, 'r');
    fs.readSync(fd, buffer, 0, 2, 0);
    fs.closeSync(fd);

    // gzip magic number: 0x1f 0x8b
    if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
      throw new Error('Invalid gzip file format');
    }
  } else {
    // For SQL files, check for common SQL keywords
    const content = fs.readFileSync(filepath, 'utf-8').substring(0, 1000);
    if (
      !content.includes('CREATE TABLE') &&
      !content.includes('INSERT INTO') &&
      !content.includes('MySQL dump')
    ) {
      throw new Error('Backup file does not appear to be a valid SQL dump');
    }
  }

  logger.log('✅ Backup file is valid');
}

/**
 * Cleans up old backup files
 */
async function cleanupOldBackups(
  backupDir: string,
  retentionDays: number,
): Promise<void> {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const file of files) {
    if (!file.endsWith('.sql') && !file.endsWith('.sql.gz')) {
      continue;
    }

    const filepath = path.join(backupDir, file);
    const stats = fs.statSync(filepath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      fs.unlinkSync(filepath);
      deletedCount++;
      logger.log(`🗑️  Deleted old backup: ${file}`);
    }
  }

  if (deletedCount === 0) {
    logger.log('✅ No old backups to clean up');
  } else {
    logger.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
  }
}

/**
 * Lists all available backups
 */
export async function listBackups(): Promise<void> {
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
        age: Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => b.age - a.age);

  if (files.length === 0) {
    logger.log('📁 No backups found');
    return;
  }

  logger.log('\n=== AVAILABLE BACKUPS ===\n');
  console.table(files);
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const compress = args.includes('--compress');
  const nameArg = args.find((arg) => arg.startsWith('--name='));
  const name = nameArg ? nameArg.split('=')[1] : undefined;
  const listArg = args.includes('--list');

  if (listArg) {
    listBackups().catch((error) => {
      logger.error('Failed to list backups:', error);
      process.exit(1);
    });
  } else {
    createBackup({ name, compress })
      .then(() => {
        logger.log('✅ Backup completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('❌ Backup failed:', error);
        process.exit(1);
      });
  }
}
