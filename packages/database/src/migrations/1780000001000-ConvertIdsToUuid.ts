import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertIdsToUuid1780000001000 implements MigrationInterface {
  name = 'ConvertIdsToUuid1780000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await queryRunner.query(
      `ALTER TABLE "app_user" ADD COLUMN "new_id" uuid NOT NULL DEFAULT gen_random_uuid()`,
    );

    await queryRunner.query(
      `ALTER TABLE "account" ADD COLUMN "new_id" uuid NOT NULL DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD COLUMN "new_user_id" uuid`,
    );
    await queryRunner.query(
      `UPDATE "account" a SET "new_user_id" = u."new_id" FROM "app_user" u WHERE a."user_id" = u."id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN "new_id" uuid NOT NULL DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN "new_account_id" uuid`,
    );
    await queryRunner.query(
      `UPDATE "transaction" t SET "new_account_id" = a."new_id" FROM "account" a WHERE t."account_id" = a."id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "loan" ADD COLUMN "new_id" uuid NOT NULL DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(`ALTER TABLE "loan" ADD COLUMN "new_user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "loan" ADD COLUMN "new_account_id" uuid`,
    );
    await queryRunner.query(
      `UPDATE "loan" l SET "new_user_id" = u."new_id" FROM "app_user" u WHERE l."user_id" = u."id"`,
    );
    await queryRunner.query(
      `UPDATE "loan" l SET "new_account_id" = a."new_id" FROM "account" a WHERE l."account_id" = a."id"`,
    );

    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_record record;
      BEGIN
        FOR constraint_record IN
          SELECT conname, conrelid::regclass AS table_name
          FROM pg_constraint
          WHERE contype = 'f'
            AND connamespace = 'public'::regnamespace
            AND (
              (conrelid = 'account'::regclass AND confrelid = 'app_user'::regclass)
              OR (conrelid = 'transaction'::regclass AND confrelid = 'account'::regclass)
              OR (conrelid = 'loan'::regclass AND confrelid = 'app_user'::regclass)
              OR (conrelid = 'loan'::regclass AND confrelid = 'account'::regclass)
            )
        LOOP
          EXECUTE format(
            'ALTER TABLE %s DROP CONSTRAINT %I',
            constraint_record.table_name,
            constraint_record.conname
          );
        END LOOP;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "app_user" DROP CONSTRAINT IF EXISTS "app_user_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" DROP CONSTRAINT IF EXISTS "loan_pkey"`,
    );

    await queryRunner.query(`ALTER TABLE "app_user" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "app_user" RENAME COLUMN "new_id" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_user" ADD CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")`,
    );

    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "account" RENAME COLUMN "new_id" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" RENAME COLUMN "new_user_id" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "fkjajia7qudllc01cly9yddon8u" FOREIGN KEY ("user_id") REFERENCES "app_user"("id")`,
    );

    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" RENAME COLUMN "new_id" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" RENAME COLUMN "new_account_id" TO "account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "account_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "fk6g20fcr3bhr6bihgy24rq1r1b" FOREIGN KEY ("account_id") REFERENCES "account"("id")`,
    );

    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "account_id"`);
    await queryRunner.query(`ALTER TABLE "loan" RENAME COLUMN "new_id" TO "id"`);
    await queryRunner.query(
      `ALTER TABLE "loan" RENAME COLUMN "new_user_id" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" RENAME COLUMN "new_account_id" TO "account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ALTER COLUMN "account_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ADD CONSTRAINT "loan_pkey" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ADD CONSTRAINT "fkjcauugddigslh9xi7v2n9tiwj" FOREIGN KEY ("user_id") REFERENCES "app_user"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ADD CONSTRAINT "fkgv9cgsh4k76wmaf83ktoekpub" FOREIGN KEY ("account_id") REFERENCES "account"("id")`,
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'La conversión de IDs a UUID no es reversible automáticamente. Restaura la base desde un backup.',
    );
  }
}
