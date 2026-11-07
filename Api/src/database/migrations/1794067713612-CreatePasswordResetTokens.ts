import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1794067713612 implements MigrationInterface {
  name = 'CreatePasswordResetTokens1794067713612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_password_reset_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_password_reset_tokens_user_id"
      ON "password_reset_tokens" ("user_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_password_reset_tokens_token_hash"
      ON "password_reset_tokens" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_password_reset_tokens_expires_at"
      ON "password_reset_tokens" ("expires_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "fk_password_reset_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      DROP CONSTRAINT "fk_password_reset_tokens_user"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_password_reset_tokens_expires_at"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_password_reset_tokens_token_hash"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_password_reset_tokens_user_id"
    `);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
