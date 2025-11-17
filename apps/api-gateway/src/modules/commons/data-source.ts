// To be used to run migrations

import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { entities } from './db.config';
import { migrations } from '../../../../../database/migrations';
import { values } from 'lodash';

dotenv.config();

export default new DataSource({
  name: 'default',
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE_NAME,
  connectTimeout: 29000,
  timezone: 'Z',

  entities: entities,
  logging: false,
  synchronize: false,
  dropSchema: false,
  migrations: values(migrations),

  namingStrategy: new SnakeNamingStrategy(),
});
