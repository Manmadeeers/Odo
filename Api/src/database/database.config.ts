import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

export function createDatabaseOptions(databaseUrl: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    installExtensions: false,
    uuidExtension: 'pgcrypto',
    entities: [join(import.meta.dirname, '../modules/**/*.entity.{ts,js}')],
    migrations: [join(import.meta.dirname, 'migrations/*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    synchronize: false,
  };
}
