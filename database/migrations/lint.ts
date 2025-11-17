import { Logger } from '@nestjs/common';
import { migrations } from './index';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enterprise Migration Linter
 *
 * Validates migration code quality and best practices:
 * - Ensures down() methods are implemented
 * - Checks for transaction handling
 * - Validates error handling
 * - Checks for documentation
 * - Validates SQL safety
 * - Checks naming conventions
 */

const logger = new Logger('MigrationLint');

interface LintIssue {
  migration: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  line?: number;
}

export async function lintMigrations(): Promise<void> {
  const issues: LintIssue[] = [];

  logger.log('🔍 Linting migrations...\n');

  for (const migration of migrations) {
    const migrationName = migration.name;
    logger.log(`Checking: ${migrationName}`);

    // Get migration file path
    const migrationFiles = fs
      .readdirSync(path.join(__dirname))
      .filter((f) => f.includes(migrationName.replace('export', '')));

    if (migrationFiles.length === 0) {
      issues.push({
        migration: migrationName,
        severity: 'ERROR',
        category: 'File',
        message: 'Migration file not found',
      });
      continue;
    }

    const filepath = path.join(__dirname, migrationFiles[0]);
    const content = fs.readFileSync(filepath, 'utf-8');

    // Check 1: Has down() implementation
    checkDownMethod(content, migrationName, issues);

    // Check 2: Has documentation
    checkDocumentation(content, migrationName, issues);

    // Check 3: Error handling
    checkErrorHandling(content, migrationName, issues);

    // Check 4: Transaction handling
    checkTransactionHandling(content, migrationName, issues);

    // Check 5: SQL safety
    checkSqlSafety(content, migrationName, issues);

    // Check 6: Naming conventions
    checkNamingConventions(migrationName, issues);

    // Check 7: Idempotency
    checkIdempotency(content, migrationName, issues);
  }

  // Display results
  displayResults(issues);

  // Exit with error code if there are errors
  const errors = issues.filter((i) => i.severity === 'ERROR');
  if (errors.length > 0) {
    throw new Error(`${errors.length} migration error(s) found`);
  }
}

function checkDownMethod(
  content: string,
  migrationName: string,
  issues: LintIssue[],
): void {
  const downMethodMatch = content.match(
    /public\s+async\s+down\s*\([^)]*\)\s*:\s*Promise<void>\s*\{([^}]*)\}/,
  );

  if (!downMethodMatch) {
    issues.push({
      migration: migrationName,
      severity: 'ERROR',
      category: 'Rollback',
      message: 'Missing down() method',
    });
    return;
  }

  const downBody = downMethodMatch[1].trim();
  if (!downBody || downBody.length < 10) {
    issues.push({
      migration: migrationName,
      severity: 'ERROR',
      category: 'Rollback',
      message: 'down() method is empty or incomplete',
    });
  }
}

function checkDocumentation(
  content: string,
  migrationName: string,
  issues: LintIssue[],
): void {
  const hasBlockComment = content.includes('/**');
  const hasPurpose = content.includes('Purpose:');

  if (!hasBlockComment) {
    issues.push({
      migration: migrationName,
      severity: 'WARNING',
      category: 'Documentation',
      message: 'Missing JSDoc comment block',
    });
  }

  if (!hasPurpose) {
    issues.push({
      migration: migrationName,
      severity: 'WARNING',
      category: 'Documentation',
      message: 'Missing Purpose section in documentation',
    });
  }
}

function checkErrorHandling(
  content: string,
  migrationName: string,
  issues: LintIssue[],
): void {
  const upMethod = content.match(
    /public\s+async\s+up\s*\([^)]*\)\s*:\s*Promise<void>\s*\{[\s\S]*?\n\s*\}/,
  );

  if (upMethod) {
    const upBody = upMethod[0];
    const hasTryCatch = upBody.includes('try') && upBody.includes('catch');

    if (!hasTryCatch && upBody.split('\n').length > 10) {
      issues.push({
        migration: migrationName,
        severity: 'INFO',
        category: 'Error Handling',
        message:
          'Consider adding try-catch for better error handling in complex migrations',
      });
    }
  }
}

function checkTransactionHandling(
  content: string,
  migrationName: string,
  issues: LintIssue[],
): void {
  // Check if migration uses transactions
  const hasTransaction =
    content.includes('startTransaction') ||
    content.includes('commitTransaction') ||
    content.includes('rollbackTransaction');

  // For multi-statement migrations, recommend explicit transactions
  const queryCount = (content.match(/queryRunner\.query/g) || []).length;

  if (queryCount > 5 && !hasTransaction) {
    issues.push({
      migration: migrationName,
      severity: 'INFO',
      category: 'Transaction',
      message:
        'Complex migration with multiple queries. Consider explicit transaction handling.',
    });
  }
}

function checkSqlSafety(
  content: string,
  migrationName: string,
  issues: LintIssue[],
): void {
  // Check for potential SQL injection (string interpolation)
  const hasStringInterpolation = content.includes('${') && content.includes('`');
  const queryMatches = content.match(/queryRunner\.query\(/g) || [];

  for (let i = 0; i < queryMatches.length; i++) {
    const queryIndex = content.indexOf(queryMatches[i]);
    const queryBlock = content.substring(queryIndex, queryIndex + 200);

    if (queryBlock.includes('${') && queryBlock.includes('`')) {
      issues.push({
        migration: migrationName,
        severity: 'ERROR',
        category: 'Security',
        message:
          'Potential SQL injection: avoid string interpolation in queries. Use parameterized queries.',
      });
      break;
    }
  }

  // Check for dangerous operations without safety checks
  const dangerousOps = ['DROP DATABASE', 'TRUNCATE', 'DROP TABLE'];
  for (const op of dangerousOps) {
    if (content.toUpperCase().includes(op)) {
      issues.push({
        migration: migrationName,
        severity: 'WARNING',
        category: 'Safety',
        message: `Contains dangerous operation: ${op}. Ensure proper safety checks.`,
      });
    }
  }
}

function checkNamingConventions(
  migrationName: string,
  issues: LintIssue[],
): void {
  // Migration names should be descriptive
  if (migrationName.length < 15) {
    issues.push({
      migration: migrationName,
      severity: 'INFO',
      category: 'Naming',
      message: 'Migration name is very short. Consider more descriptive names.',
    });
  }

  // Check for timestamp pattern
  if (!/\d{13}/.test(migrationName)) {
    issues.push({
      migration: migrationName,
      severity: 'WARNING',
      category: 'Naming',
      message: 'Migration name should include timestamp',
    });
  }
}

function checkIdempotency(
  content: string,
  migrationName: string,
  issues: LintIssue[],
): void {
  const hasIfNotExists = content.includes('IF NOT EXISTS');
  const hasCreateTable = content.includes('CREATE TABLE');
  const hasCreateIndex = content.includes('CREATE INDEX');

  if ((hasCreateTable || hasCreateIndex) && !hasIfNotExists) {
    issues.push({
      migration: migrationName,
      severity: 'INFO',
      category: 'Idempotency',
      message:
        'Consider using IF NOT EXISTS for CREATE statements to ensure idempotency',
    });
  }
}

function displayResults(issues: LintIssue[]): void {
  logger.log('\n' + '='.repeat(70));
  logger.log('MIGRATION LINT RESULTS');
  logger.log('='.repeat(70) + '\n');

  if (issues.length === 0) {
    logger.log('✅ All migrations passed linting! No issues found.\n');
    return;
  }

  // Group by severity
  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARNING');
  const infos = issues.filter((i) => i.severity === 'INFO');

  // Display errors
  if (errors.length > 0) {
    logger.error(`\n❌ ERRORS (${errors.length}):\n`);
    errors.forEach((issue) => {
      logger.error(
        `  [${issue.category}] ${issue.migration}\n    ${issue.message}\n`,
      );
    });
  }

  // Display warnings
  if (warnings.length > 0) {
    logger.warn(`\n⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach((issue) => {
      logger.warn(
        `  [${issue.category}] ${issue.migration}\n    ${issue.message}\n`,
      );
    });
  }

  // Display info
  if (infos.length > 0) {
    logger.log(`\nℹ️  INFO (${infos.length}):\n`);
    infos.forEach((issue) => {
      logger.log(
        `  [${issue.category}] ${issue.migration}\n    ${issue.message}\n`,
      );
    });
  }

  // Summary
  logger.log('─'.repeat(70));
  logger.log(
    `Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`,
  );
  logger.log('─'.repeat(70) + '\n');

  // Recommendations
  if (errors.length > 0) {
    logger.error('⛔ Fix all errors before deploying to production!\n');
  } else if (warnings.length > 0) {
    logger.warn('⚠️  Review warnings before deploying to production.\n');
  }
}

// CLI execution
if (require.main === module) {
  lintMigrations()
    .then(() => {
      logger.log('✅ Linting completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Linting failed:', error.message);
      process.exit(1);
    });
}
