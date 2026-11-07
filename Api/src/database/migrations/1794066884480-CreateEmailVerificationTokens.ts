import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailVerificationTokens1794066884480 implements MigrationInterface {
  name = 'CreateEmailVerificationTokens1794066884480';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_verification_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_email_verification_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_email_verification_tokens_user_id"
      ON "email_verification_tokens" ("user_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_email_verification_tokens_token_hash"
      ON "email_verification_tokens" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_email_verification_tokens_expires_at"
      ON "email_verification_tokens" ("expires_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "email_verification_tokens"
      ADD CONSTRAINT "fk_email_verification_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_verification_tokens"
      DROP CONSTRAINT "fk_email_verification_tokens_user"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_email_verification_tokens_expires_at"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_email_verification_tokens_token_hash"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_email_verification_tokens_user_id"
    `);
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
  }
}
