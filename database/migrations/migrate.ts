import { Logger } from '@nestjs/common';
import dataSource from '../../apps/api-gateway/src/modules/commons/data-source';

export const migrateDatabase = async () => {
  const logger = new Logger('DBMigrate');
  logger.verbose('db.migration.started');
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
  logger.verbose('db.migration.finished');
};
