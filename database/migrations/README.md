# Database Migrations - Enterprise Guide

This directory contains all database migrations for the Twitter Backend application using TypeORM with enterprise-level best practices.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Migration Best Practices](#migration-best-practices)
- [Migration Structure](#migration-structure)
- [Safety Features](#safety-features)
- [Testing Migrations](#testing-migrations)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Running Migrations

```bash
# Check migration status
npm run migration:status

# Run pending migrations
npm run migration:run

# Rollback last migration
npm run migration:revert

# Show migration history
npm run migration:show
```

### Creating New Migrations

```bash
# Generate migration from entity changes
npm run migration:generate MigrationName

# Create empty migration
npm run typeorm migration:create database/migrations/MigrationName
```

---

## 📚 Available Commands

### Migration Operations

| Command | Description |
|---------|-------------|
| `npm run migration:status` | Show detailed migration status dashboard |
| `npm run migration:run` | Execute all pending migrations |
| `npm run migration:revert` | Rollback the last executed migration |
| `npm run migration:show` | Display migration history |
| `npm run migration:generate <name>` | Generate migration from entity changes |
| `npm run migration:lint` | Validate migration code quality |
| `npm run migration:test` | Run migration test suite |

### Backup & Restore

| Command | Description |
|---------|-------------|
| `npm run db:backup` | Create database backup |
| `npm run db:backup:list` | List all available backups |
| `npm run db:restore -- --file=<name>` | Restore from specific backup |
| `npm run db:restore:latest` | Restore from latest backup |
| `npm run db:restore:list` | List available backups for restore |

### Database Management

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Drop, migrate, and seed database |

---

## ✅ Migration Best Practices

### 1. **Always Test Before Production**

```bash
# Run linter to check for issues
npm run migration:lint

# Run test suite
npm run migration:test

# Check migration status
npm run migration:status
```

### 2. **Always Create Backups**

```bash
# Create backup before running migrations in production
npm run db:backup -- --name="pre-deployment-$(date +%Y%m%d)"

# Run migrations
npm run migration:run
```

### 3. **Write Reversible Migrations**

Every migration MUST have a proper `down()` method:

```typescript
export class AddUserColumn implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN new_field VARCHAR(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REQUIRED: Implement rollback
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN new_field`
    );
  }
}
```

### 4. **Document Your Migrations**

```typescript
/**
 * Migration: Add User Verification Status
 *
 * Purpose: Add verified column to track verified users
 *
 * Jira: PROJ-123
 * Author: john.doe@company.com
 * Date: 2024-01-27
 *
 * Rollback: Safe - removes column only
 *
 * Testing: Tested on staging with 1M users
 */
export class AddVerifiedField implements MigrationInterface {
  // ...
}
```

### 5. **Use Transactions**

Migrations automatically use transactions via `migrate.ts`, but for complex operations:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Transaction is automatically started by migrate.ts
  await queryRunner.query(`...`);
  await queryRunner.query(`...`);
  // Transaction is automatically committed
}
```

### 6. **Check for Existing Data**

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Check for conflicts before making changes
  const duplicates = await queryRunner.query(
    `SELECT username, COUNT(*) as count
     FROM users GROUP BY username HAVING count > 1`
  );

  if (duplicates.length > 0) {
    throw new Error('Cannot add unique constraint: duplicates exist');
  }

  await queryRunner.query(
    `ALTER TABLE users ADD UNIQUE INDEX idx_username (username)`
  );
}
```

---

## 🏗️ Migration Structure

### File Naming Convention

```
{timestamp}-{Description}.ts

Examples:
- 1763369000000-AddSoftDeleteSupport.ts
- 1763369100000-FixUsernameConstraints.ts
- 1763369200000-AddPerformanceIndexes.ts
```

### Migration Template

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: [Description]
 *
 * Purpose: [Why this migration is needed]
 *
 * Prerequisites: [Any requirements before running]
 *
 * Rollback: [Rollback safety information]
 */
export class MigrationName implements MigrationInterface {
  name = 'MigrationName';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration logic here
    await queryRunner.query(`...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add rollback logic here
    await queryRunner.query(`...`);
  }
}
```

### Current Migration Chain

1. **InitSchema** - Baseline database schema
2. **UpdateUsernameField** - Add sessions & user_followings tables
3. **UpdateEmailField** - Add unique index on email
4. **AddSoftDeleteSupport** - Add deleted_at columns for soft deletes
5. **FixUsernameConstraints** - Make username NOT NULL & UNIQUE
6. **AddPerformanceIndexes** - Add critical performance indexes
7. **AddUniqueConstraintLikes** - Prevent duplicate likes

---

## 🛡️ Safety Features

### 1. **Transaction Support**

All migrations run in a single transaction. If any step fails, the entire migration is rolled back automatically.

### 2. **Production Safety Checks**

```typescript
// migrate.ts automatically checks:
- Environment detection (warns on production)
- Pending migration validation
- Error handling with detailed logging
```

### 3. **Backup Before Restore**

```bash
# Automatic pre-restore backup
npm run db:restore -- --file=backup.sql
# Creates pre-restore backup automatically
```

### 4. **Migration Linting**

```bash
npm run migration:lint
# Checks for:
- Empty down() methods
- Missing documentation
- SQL injection risks
- Dangerous operations
- Naming conventions
```

### 5. **Validation After Operations**

All backup and restore operations include automatic validation to ensure success.

---

## 🧪 Testing Migrations

### Running Tests

```bash
# Run full migration test suite
npm run migration:test

# Tests include:
- All migrations run successfully
- All migrations can be rolled back
- Migrations are idempotent
- Referential integrity is maintained
- Performance benchmarks pass
```

### Test Structure

```typescript
describe('Migration Test Suite', () => {
  it('should run all migrations without errors', async () => {
    await dataSource.runMigrations();
  });

  it('should rollback last migration', async () => {
    await dataSource.undoLastMigration();
  });

  it('should maintain referential integrity', async () => {
    // Test FK constraints
  });
});
```

---

## 🔧 Troubleshooting

### Migration Failed

```bash
# 1. Check migration status
npm run migration:status

# 2. Check logs for error details

# 3. Rollback if needed
npm run migration:revert

# 4. Fix the issue in migration code

# 5. Try again
npm run migration:run
```

### Duplicate Entry Errors

```typescript
// Add data cleanup in migration
public async up(queryRunner: QueryRunner): Promise<void> {
  // Clean up duplicates first
  const duplicates = await queryRunner.query(`
    SELECT user_id, post_id, COUNT(*) as count
    FROM likes GROUP BY user_id, post_id HAVING count > 1
  `);

  for (const dup of duplicates) {
    // Keep oldest, delete rest
    await queryRunner.query(`
      DELETE FROM likes
      WHERE user_id = ? AND post_id = ?
      AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM likes
          WHERE user_id = ? AND post_id = ?
          ORDER BY created_at ASC LIMIT 1
        ) as temp
      )
    `, [dup.user_id, dup.post_id, dup.user_id, dup.post_id]);
  }

  // Now add unique constraint
  await queryRunner.query(`
    ALTER TABLE likes
    ADD UNIQUE INDEX UQ_likes_user_post (user_id, post_id)
  `);
}
```

### Restore Database from Backup

```bash
# List available backups
npm run db:restore:list

# Restore from specific backup
npm run db:restore -- --file=backup-2024-01-27.sql

# Or restore latest
npm run db:restore:latest
```

### Check Migration Health

```bash
# Comprehensive status check
npm run migration:status

# Output shows:
- Total migrations
- Executed migrations
- Pending migrations
- Last migration date
- Health status
- Recommendations
```

---

## 📊 Migration Status Dashboard

The status dashboard provides:

- **Database Information**: Name, host, environment
- **Summary Statistics**: Total, executed, pending migrations
- **Last Migration**: When it was run and how long ago
- **Health Check**: Overall status and issues
- **Executed Migrations**: Recent migration history
- **Pending Migrations**: What needs to be run
- **Recommendations**: Actionable suggestions

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** with database credentials
2. **Use parameterized queries** to prevent SQL injection
3. **Validate user input** before using in migrations
4. **Limit migration execution** to authorized personnel in production
5. **Audit all migration runs** in production environments
6. **Test migrations** thoroughly in staging before production

---

## 📝 Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [MySQL Best Practices](https://dev.mysql.com/doc/)
- Internal Wiki: Database Management Guide
- Runbook: Production Migration Procedures

---

## 🆘 Support

For issues or questions:

1. Check this README
2. Run `npm run migration:status` for diagnostics
3. Review migration logs in the console
4. Contact the database team: #database-support

---

**Last Updated**: 2024-01-27
**Maintained by**: Platform Team
