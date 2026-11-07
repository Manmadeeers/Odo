import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgis1794042000000 implements MigrationInterface {
  name = 'EnablePostgis1794042000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
  }

  public down(): Promise<void> {
    // PostGIS is an infrastructure requirement and is intentionally retained.
    return Promise.resolve();
  }
}
