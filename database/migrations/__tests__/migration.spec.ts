import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import dataSource from '../../../apps/api-gateway/src/modules/commons/data-source';

/**
 * Enterprise Migration Test Suite
 *
 * Tests:
 * - All migrations run successfully
 * - All migrations can be rolled back
 * - Migrations are idempotent
 * - Referential integrity is maintained
 * - Performance benchmarks
 */
describe('Migration Test Suite', () => {
  let testDataSource: DataSource;
  const logger = new Logger('MigrationTest');

  beforeAll(async () => {
    // Use test database
    testDataSource = dataSource;
  });

  afterAll(async () => {
    if (testDataSource?.isInitialized) {
      await testDataSource.destroy();
    }
  });

  describe('Migration Execution', () => {
    it('should initialize data source', async () => {
      if (!testDataSource.isInitialized) {
        await expect(testDataSource.initialize()).resolves.not.toThrow();
      }
      expect(testDataSource.isInitialized).toBe(true);
    }, 30000);

    it('should run all pending migrations without errors', async () => {
      const startTime = Date.now();

      await expect(
        testDataSource.runMigrations({ transaction: 'all' }),
      ).resolves.not.toThrow();

      const duration = Date.now() - startTime;
      logger.log(`✅ All migrations completed in ${duration}ms`);

      // Performance check: migrations should complete in reasonable time
      expect(duration).toBeLessThan(60000); // < 60 seconds
    }, 120000);

    it('should show no pending migrations after running', async () => {
      const hasPending = await testDataSource.showMigrations();
      expect(hasPending).toBe(false);
    });

    it('should have created all expected tables', async () => {
      const tables = [
        'users',
        'posts',
        'passwords',
        'sessions',
        'user_followings',
        'likes',
        'migrations',
      ];

      for (const tableName of tables) {
        const hasTable = await testDataSource.query(
          `SHOW TABLES LIKE '${tableName}'`,
        );
        expect(hasTable.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Migration Rollback', () => {
    it('should rollback last migration without errors', async () => {
      await expect(testDataSource.undoLastMigration()).resolves.not.toThrow();
      logger.log('✅ Last migration rolled back successfully');
    }, 30000);

    it('should be able to re-run migration after rollback', async () => {
      await expect(
        testDataSource.runMigrations({ transaction: 'all' }),
      ).resolves.not.toThrow();
      logger.log('✅ Migration re-run successful after rollback');
    }, 30000);
  });

  describe('Idempotency Tests', () => {
    it('should handle re-running migrations gracefully', async () => {
      // Try to run migrations again (should be no-op)
      await expect(
        testDataSource.runMigrations({ transaction: 'all' }),
      ).resolves.not.toThrow();

      const hasPending = await testDataSource.showMigrations();
      expect(hasPending).toBe(false);
    });
  });

  describe('Schema Validation', () => {
    it('should have deleted_at column on all main tables', async () => {
      const tables = [
        'users',
        'posts',
        'passwords',
        'sessions',
        'user_followings',
        'likes',
      ];

      for (const tableName of tables) {
        const columns = await testDataSource.query(
          `SHOW COLUMNS FROM \`${tableName}\` LIKE 'deleted_at'`,
        );
        expect(columns.length).toBe(1);
      }
    });

    it('should have unique constraint on users.username', async () => {
      const indexes = await testDataSource.query(
        `SHOW INDEX FROM \`users\` WHERE Column_name = 'username' AND Non_unique = 0`,
      );
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have unique constraint on users.email', async () => {
      const indexes = await testDataSource.query(
        `SHOW INDEX FROM \`users\` WHERE Column_name = 'email' AND Non_unique = 0`,
      );
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have unique constraint on likes(user_id, post_id)', async () => {
      const indexes = await testDataSource.query(
        `SHOW INDEX FROM \`likes\` WHERE Key_name = 'UQ_likes_user_post'`,
      );
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have performance indexes', async () => {
      const expectedIndexes = [
        { table: 'sessions', column: 'user_id', index: 'IDX_sessions_user_id' },
        { table: 'posts', column: 'created_at', index: 'IDX_posts_created_at' },
        {
          table: 'user_followings',
          column: 'followee_id',
          index: 'IDX_user_followings_followee',
        },
      ];

      for (const { table, index } of expectedIndexes) {
        const indexes = await testDataSource.query(
          `SHOW INDEX FROM \`${table}\` WHERE Key_name = '${index}'`,
        );
        expect(indexes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Referential Integrity', () => {
    it('should enforce foreign key constraints on posts.author_id', async () => {
      // Try to insert post with non-existent author
      await expect(
        testDataSource.query(
          `INSERT INTO posts (id, text, author_id, created_at, updated_at)
           VALUES (UUID(), 'test', 'non-existent-id', NOW(), NOW())`,
        ),
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints on likes.user_id', async () => {
      await expect(
        testDataSource.query(
          `INSERT INTO likes (id, user_id, post_id, created_at, updated_at)
           VALUES (UUID(), 'non-existent-id', 'fake-post-id', NOW(), NOW())`,
        ),
      ).rejects.toThrow();
    });

    it('should prevent duplicate likes with unique constraint', async () => {
      // Create test user and post first
      const userId = 'test-user-' + Date.now();
      const postId = 'test-post-' + Date.now();

      await testDataSource.query(
        `INSERT INTO users (id, username, email, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [userId, `testuser${Date.now()}`, `test${Date.now()}@example.com`],
      );

      await testDataSource.query(
        `INSERT INTO posts (id, text, author_id, created_at, updated_at)
         VALUES (?, 'test post', ?, NOW(), NOW())`,
        [postId, userId],
      );

      // First like should succeed
      await expect(
        testDataSource.query(
          `INSERT INTO likes (id, user_id, post_id, created_at, updated_at)
           VALUES (UUID(), ?, ?, NOW(), NOW())`,
          [userId, postId],
        ),
      ).resolves.not.toThrow();

      // Second like should fail (duplicate)
      await expect(
        testDataSource.query(
          `INSERT INTO likes (id, user_id, post_id, created_at, updated_at)
           VALUES (UUID(), ?, ?, NOW(), NOW())`,
          [userId, postId],
        ),
      ).rejects.toThrow();

      // Cleanup
      await testDataSource.query(`DELETE FROM likes WHERE user_id = ?`, [
        userId,
      ]);
      await testDataSource.query(`DELETE FROM posts WHERE id = ?`, [postId]);
      await testDataSource.query(`DELETE FROM users WHERE id = ?`, [userId]);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should query user posts efficiently with index', async () => {
      // This test verifies the composite index on (author_id, created_at) works
      const query = `
        EXPLAIN SELECT * FROM posts
        WHERE author_id = 'test-id'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await testDataSource.query(query);

      // Should use index, not full table scan
      expect(result[0].type).not.toBe('ALL');
    });

    it('should query global feed efficiently with index', async () => {
      const query = `
        EXPLAIN SELECT * FROM posts
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await testDataSource.query(query);

      // Should use index on created_at
      expect(result[0].key).toContain('created_at');
    });
  });
});
