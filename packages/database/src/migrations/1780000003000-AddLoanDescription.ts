import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoanDescription1780000003000 implements MigrationInterface {
  name = 'AddLoanDescription1780000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan" ADD COLUMN IF NOT EXISTS "description" varchar(255)`,
    );

    // Backfill: recupera el motivo desde la transacción EGRESO_PRESTAMO
    // cuyo description tiene el formato "Préstamo a <deudor>: <motivo>".
    await queryRunner.query(`
      UPDATE "loan" l
      SET "description" = substring(t."description" from position(': ' in t."description") + 2)
      FROM "transaction" t
      WHERE t."transaction_type" = 'EGRESO_PRESTAMO'
        AND t."account_id" = l."account_id"
        AND t."amount" = l."amount"
        AND t."description" LIKE 'Préstamo a ' || l."debtor_name" || '%'
        AND position(': ' in t."description") > 0
        AND (l."description" IS NULL OR l."description" = '')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan" DROP COLUMN IF EXISTS "description"`,
    );
  }
}
