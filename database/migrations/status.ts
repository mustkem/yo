import { Logger } from '@nestjs/common';
import dataSource from '../../apps/api-gateway/src/modules/commons/data-source';
import { migrations } from './index';

/**
 * Enterprise Migration Status Dashboard
 *
 * Displays:
 * - Executed migrations with timestamps
 * - Pending migrations
 * - Migration health status
 * - Last migration date
 * - Database version
 */

const logger = new Logger('MigrationStatus');

interface MigrationRecord {
  name: string;
  timestamp: number;
  executedAt?: Date;
  status: 'executed' | 'pending' | 'unknown';
  duration?: number;
}

export async function getMigrationStatus(): Promise<void> {
  try {
    logger.log('🔍 Fetching migration status...\n');

    // Initialize data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Get executed migrations from database
    let executedMigrations: any[] = [];
    try {
      executedMigrations = await dataSource.query(
        'SELECT * FROM migrations ORDER BY timestamp DESC',
      );
    } catch (error) {
      logger.warn('⚠️  Migrations table not found. Database may not be initialized.');
      executedMigrations = [];
    }

    // Build migration status map
    const migrationRecords: MigrationRecord[] = [];
    const executedMap = new Map(
      executedMigrations.map((m) => [m.name, m]),
    );

    for (const migration of migrations) {
      const executed = executedMap.get(migration.name);
      migrationRecords.push({
        name: migration.name,
        timestamp: parseInt(migration.name.match(/\d+/)?.[0] || '0'),
        executedAt: executed ? new Date(executed.timestamp) : undefined,
        status: executed ? 'executed' : 'pending',
      });
    }

    // Display header
    logger.log('═'.repeat(80));
    logger.log('                    DATABASE MIGRATION STATUS');
    logger.log('═'.repeat(80));
    logger.log('');

    // Database info
    const dbName = process.env.DB_DATABASE_NAME || 'twitter';
    const dbHost = process.env.DB_HOST || 'localhost';
    const environment = process.env.NODE_ENV || 'development';

    logger.log(`📊 Database: ${dbName}@${dbHost}`);
    logger.log(`🌍 Environment: ${environment.toUpperCase()}`);
    logger.log('');

    // Summary statistics
    const totalMigrations = migrationRecords.length;
    const executedCount = migrationRecords.filter(
      (m) => m.status === 'executed',
    ).length;
    const pendingCount = totalMigrations - executedCount;

    logger.log('📈 Summary:');
    logger.log(`   Total Migrations:    ${totalMigrations}`);
    logger.log(`   ✅ Executed:         ${executedCount}`);
    logger.log(`   ⏳ Pending:          ${pendingCount}`);
    logger.log('');

    // Last migration date
    if (executedCount > 0) {
      const lastMigration = migrationRecords.find((m) => m.status === 'executed');
      if (lastMigration?.executedAt) {
        const timeSinceLastMigration = getTimeSince(lastMigration.executedAt);
        logger.log(`🕐 Last Migration: ${lastMigration.executedAt.toLocaleString()}`);
        logger.log(`   (${timeSinceLastMigration} ago)`);
        logger.log('');
      }
    }

    // Health check
    const healthStatus = getHealthStatus(migrationRecords, executedMigrations);
    displayHealthStatus(healthStatus);

    // Executed migrations
    if (executedCount > 0) {
      logger.log('─'.repeat(80));
      logger.log('✅ EXECUTED MIGRATIONS:');
      logger.log('─'.repeat(80));
      logger.log('');

      const executed = migrationRecords.filter((m) => m.status === 'executed');
      executed.slice(0, 10).forEach((migration, index) => {
        const date = migration.executedAt
          ? migration.executedAt.toLocaleString()
          : 'Unknown';
        const timeSince = migration.executedAt
          ? `(${getTimeSince(migration.executedAt)} ago)`
          : '';

        logger.log(`${index + 1}. ${migration.name}`);
        logger.log(`   📅 Executed: ${date} ${timeSince}`);
        logger.log('');
      });

      if (executed.length > 10) {
        logger.log(`   ... and ${executed.length - 10} more migrations\n`);
      }
    }

    // Pending migrations
    if (pendingCount > 0) {
      logger.log('─'.repeat(80));
      logger.log('⏳ PENDING MIGRATIONS:');
      logger.log('─'.repeat(80));
      logger.log('');

      const pending = migrationRecords.filter((m) => m.status === 'pending');
      pending.forEach((migration, index) => {
        logger.log(`${index + 1}. ${migration.name}`);
      });
      logger.log('');

      logger.log(`💡 Run migrations with: npm run migration:run\n`);
    }

    // Footer
    logger.log('═'.repeat(80));

    // Cleanup
    await dataSource.destroy();
  } catch (error) {
    logger.error('❌ Failed to get migration status:', error.message);
    throw error;
  }
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}

function getHealthStatus(
  records: MigrationRecord[],
  executed: any[],
): HealthStatus {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check 1: Are there pending migrations?
  const pendingCount = records.filter((m) => m.status === 'pending').length;
  if (pendingCount > 0) {
    issues.push(`${pendingCount} pending migration(s)`);
    recommendations.push('Run pending migrations with: npm run migration:run');
  }

  // Check 2: Are migrations too old?
  if (executed.length > 0) {
    const lastExecuted = new Date(executed[0].timestamp);
    const daysSinceLastMigration =
      (Date.now() - lastExecuted.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastMigration > 90) {
      issues.push('Last migration was over 90 days ago');
      recommendations.push('Consider reviewing database schema for necessary updates');
    }
  }

  // Check 3: Are there too many migrations?
  if (records.length > 50) {
    issues.push(`Large number of migrations (${records.length})`);
    recommendations.push(
      'Consider squashing old migrations into a baseline schema',
    );
  }

  // Determine overall status
  let status: 'healthy' | 'warning' | 'error' = 'healthy';
  if (pendingCount > 5) {
    status = 'warning';
  }
  if (pendingCount > 10) {
    status = 'error';
  }

  return { status, issues, recommendations };
}

function displayHealthStatus(health: HealthStatus): void {
  logger.log('─'.repeat(80));
  logger.log('🏥 HEALTH CHECK:');
  logger.log('─'.repeat(80));
  logger.log('');

  if (health.status === 'healthy' && health.issues.length === 0) {
    logger.log('✅ Status: HEALTHY');
    logger.log('   All migrations are up to date. No issues detected.');
  } else {
    const statusIcon =
      health.status === 'healthy'
        ? '✅'
        : health.status === 'warning'
          ? '⚠️'
          : '❌';
    logger.log(`${statusIcon} Status: ${health.status.toUpperCase()}`);

    if (health.issues.length > 0) {
      logger.log('');
      logger.log('Issues:');
      health.issues.forEach((issue) => {
        logger.log(`   • ${issue}`);
      });
    }

    if (health.recommendations.length > 0) {
      logger.log('');
      logger.log('Recommendations:');
      health.recommendations.forEach((rec) => {
        logger.log(`   💡 ${rec}`);
      });
    }
  }

  logger.log('');
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months`;
  return `${Math.floor(seconds / 31536000)} years`;
}

// Export for use in other modules
export async function hasPendingMigrations(): Promise<boolean> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const pending = await dataSource.showMigrations();
  await dataSource.destroy();

  return pending;
}

// CLI execution
if (require.main === module) {
  getMigrationStatus()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Failed to get migration status:', error);
      process.exit(1);
    });
}
