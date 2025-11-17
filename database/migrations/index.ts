import { Initial1763401871805 } from './1763401871805-Initial';

/**
 * Migration chain - executed in order
 *
 * Enterprise-grade initial schema with all features:
 * - All 6 core tables (users, posts, passwords, sessions, user_followings, likes)
 * - Soft delete support (deleted_at columns)
 * - Unique constraints for data integrity
 * - Performance indexes (14 indexes total)
 * - Foreign key relationships with CASCADE rules
 * - Proper timestamp handling (datetime(6))
 *
 * Enterprise best practices:
 * - Migrations are immutable once deployed
 * - Each migration is atomic and reversible
 * - All migrations include comprehensive documentation
 * - Migrations are tested before production deployment
 */
export const migrations = [
  Initial1763401871805, // Complete initial schema with enterprise features
];
