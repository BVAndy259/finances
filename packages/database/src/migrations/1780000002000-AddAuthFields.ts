import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthFields1780000002000 implements MigrationInterface {
  name = 'AddAuthFields1780000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_user" ALTER COLUMN "telegram_chat_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" ADD COLUMN "email" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" ADD COLUMN "password_hash" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" ADD COLUMN "refresh_token_hash" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" ADD CONSTRAINT "UQ_app_user_email" UNIQUE ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_user" DROP CONSTRAINT IF EXISTS "UQ_app_user_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" DROP COLUMN IF EXISTS "refresh_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" DROP COLUMN IF EXISTS "password_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" DROP COLUMN IF EXISTS "email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" ALTER COLUMN "telegram_chat_id" SET NOT NULL`,
    );
  }
}
