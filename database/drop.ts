import { Logger } from '@nestjs/common';
import dataSource from '../apps/api-gateway/src/modules/commons/data-source';

export const dropDatabase = async () => {
  const logger = new Logger('DBDrop');
  logger.verbose('db.drop.started');
  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.destroy();
  logger.verbose('db.drop.finished');
};
