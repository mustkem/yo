import { Logger } from '@nestjs/common';
import dataSource from '../../apps/api-gateway/src/modules/commons/data-source';

/**
 * Migrates the database with enterprise-level safety features
 *
 * Features:
 * - Transaction support (all-or-nothing)
 * - Comprehensive error handling
 * - Detailed logging
 * - Production safety checks
 * - Pending migration validation
 */
export const migrateDatabase = async (options?: {
  dryRun?: boolean;
  skipSafetyChecks?: boolean;
}) => {
  const logger = new Logger('DBMigrate');
  const isDryRun = options?.dryRun || false;
  const skipSafetyChecks = options?.skipSafetyChecks || false;

  try {
    logger.verbose('db.migration.started');

    // Initialize data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Safety check: Confirm production environment
    if (
      process.env.NODE_ENV === 'production' &&
      !skipSafetyChecks &&
      !isDryRun
    ) {
      logger.warn('⚠️  PRODUCTION ENVIRONMENT DETECTED');
      logger.warn(
        'Running migrations on production database. Ensure backup exists!',
      );
      // In a real production system, you might add a confirmation prompt here
      // or require an approval token
    }

    // Dry run: Show pending migrations without executing
    if (isDryRun) {
      logger.log('=== DRY RUN MODE ===');
      const pendingMigrations = await dataSource.showMigrations();

      if (pendingMigrations) {
        const pending = await dataSource.showMigrations();
        logger.log(`📋 Found ${pending} pending migrations:`);
        logger.log('─'.repeat(50));
        // TypeORM showMigrations returns boolean, but we can get pending from migrations table
        const executedMigrations = await dataSource
          .query('SELECT * FROM migrations ORDER BY timestamp DESC')
          .catch(() => []);
        const allMigrations = dataSource.migrations;
        const pendingList = allMigrations.filter(
          (m) => !executedMigrations.some((em: any) => em.name === m.name),
        );
        pendingList.forEach((migration, index) => {
          logger.log(`  ${index + 1}. ${migration.name}`);
        });
      } else {
        logger.log('✅ No pending migrations');
      }
      return;
    }

    // Check for pending migrations
    const hasPendingMigrations = await dataSource.showMigrations();
    if (!hasPendingMigrations) {
      logger.log('✅ No pending migrations to run');
      return;
    }

    // Run migrations with transaction support
    logger.log('🚀 Running migrations...');
    const startTime = Date.now();

    await dataSource.runMigrations({
      transaction: 'all', // Run all migrations in a single transaction
    });

    const duration = Date.now() - startTime;
    logger.verbose('db.migration.finished');
    logger.log(`✅ Migrations completed successfully in ${duration}ms`);
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    logger.error('Stack trace:', error.stack);

    // In enterprise systems, you might:
    // - Send alert to operations team
    // - Log to monitoring system (Sentry, DataDog, etc.)
    // - Trigger automatic rollback

    throw new Error(
      `Database migration failed: ${error.message}. Database may be in an inconsistent state. Please check logs and consider restoring from backup.`,
    );
  } finally {
    // Always cleanup, even on error
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      logger.verbose('db.connection.closed');
    }
  }
};
