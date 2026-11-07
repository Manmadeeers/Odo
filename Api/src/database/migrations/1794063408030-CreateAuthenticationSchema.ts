import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthenticationSchema1794063408030 implements MigrationInterface {
  name = 'CreateAuthenticationSchema1794063408030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "email" citext NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "email_verified_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "pk_users" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email")
        `);
    await queryRunner.query(`
            CREATE TABLE "auth_sessions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "refresh_token_hash" character varying(255) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "pk_auth_sessions" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_auth_sessions_refresh_token_hash" ON "auth_sessions" ("refresh_token_hash")
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_auth_sessions_expires_at" ON "auth_sessions" ("expires_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_auth_sessions_user_id" ON "auth_sessions" ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions"
            ADD CONSTRAINT "fk_auth_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_sessions" DROP CONSTRAINT "fk_auth_sessions_user"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_auth_sessions_user_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_auth_sessions_expires_at"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_auth_sessions_refresh_token_hash"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_sessions"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_users_email"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
  }
}
