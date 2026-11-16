-- ============================================================================
-- Esquema de referencia - Gestor de Finanzas
-- ----------------------------------------------------------------------------
-- Estado final del esquema tras aplicar las migraciones de TypeORM:
--   1. InitialSchema
--   2. ConvertIdsToUuid
--   3. AddAuthFields
--
-- IMPORTANTE: las migraciones de TypeORM en `packages/database/src/migrations`
-- son la fuente de verdad. Este script es una instantánea para referencia,
-- revisión y para regenerar el diagrama entidad-relación. No sustituye a
-- `pnpm --filter @expense-tracker/database migration:run`.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios. Pueden existir solo con Telegram, solo con credenciales web o con
-- ambas. Al menos uno de `email` o `telegram_chat_id` debe estar presente
-- (invariante validado por el mapper de dominio).
CREATE TABLE IF NOT EXISTS "app_user" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "telegram_chat_id" varchar(255) UNIQUE,
  "email" varchar(255) UNIQUE,
  "password_hash" varchar(255),
  "refresh_token_hash" varchar(64),
  "alias" varchar(255),
  "created_at" timestamp
);

-- Cuentas del usuario (Yape, Efectivo, BCP, Ahorros, etc.).
CREATE TABLE IF NOT EXISTS "account" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" varchar(255),
  "balance" numeric(38, 2) NOT NULL,
  "currency" varchar(3),
  "created_at" timestamp,
  CONSTRAINT "fkjajia7qudllc01cly9yddon8u" FOREIGN KEY ("user_id")
    REFERENCES "app_user" ("id")
);

-- Movimientos: gastos, ingresos, transferencias y movimientos de préstamos.
CREATE TABLE IF NOT EXISTS "transaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL,
  "transaction_type" varchar(255),
  "amount" numeric(38, 2) NOT NULL,
  "description" varchar(255),
  "location" varchar(255),
  "transaction_date" timestamp,
  CONSTRAINT "fk6g20fcr3bhr6bihgy24rq1r1b" FOREIGN KEY ("account_id")
    REFERENCES "account" ("id")
);

-- Préstamos otorgados, con abonos parciales y fecha límite opcional.
CREATE TABLE IF NOT EXISTS "loan" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "debtor_name" varchar(255),
  "amount" numeric(38, 2) NOT NULL,
  "paid_amount" numeric(12, 2) NOT NULL,
  "due_date" date,
  "status" varchar(255),
  "created_at" timestamp,
  CONSTRAINT "fkjcauugddigslh9xi7v2n9tiwj" FOREIGN KEY ("user_id")
    REFERENCES "app_user" ("id"),
  CONSTRAINT "fkgv9cgsh4k76wmaf83ktoekpub" FOREIGN KEY ("account_id")
    REFERENCES "account" ("id")
);

COMMENT ON COLUMN "app_user"."telegram_chat_id" IS 'ID de chat de Telegram (opcional si el usuario usa credenciales web)';
COMMENT ON COLUMN "app_user"."email" IS 'Email de acceso web (único, opcional para usuarios solo de Telegram)';
COMMENT ON COLUMN "app_user"."password_hash" IS 'Hash Argon2id de la contraseña (opcional)';
COMMENT ON COLUMN "app_user"."refresh_token_hash" IS 'SHA-256 del refresh token vigente (rotación de sesión)';
COMMENT ON COLUMN "app_user"."alias" IS 'Nombre visible. Ej: Admin';

COMMENT ON COLUMN "account"."name" IS 'Ej: Yape, Efectivo, Depósito a cuenta';
COMMENT ON COLUMN "account"."balance" IS 'Saldo exacto como decimal (numeric 38,2)';
COMMENT ON COLUMN "account"."currency" IS 'Código ISO de 3 letras. Ej: PEN';

COMMENT ON COLUMN "transaction"."transaction_type" IS 'INGRESO | EGRESO | TRANSFERENCIA_SALIDA | TRANSFERENCIA_ENTRADA | EGRESO_PRESTAMO | INGRESO_COBRO';
COMMENT ON COLUMN "transaction"."amount" IS 'Monto exacto de la operación (numeric 38,2)';
COMMENT ON COLUMN "transaction"."description" IS 'Ej: Almuerzo, Pasajes, Sueldo';
COMMENT ON COLUMN "transaction"."location" IS 'Ej: Mercado Central, Transporte. Origen del registro (Bot/Web).';

COMMENT ON COLUMN "loan"."debtor_name" IS 'Nombre del deudor';
COMMENT ON COLUMN "loan"."amount" IS 'Monto prestado (numeric 38,2)';
COMMENT ON COLUMN "loan"."paid_amount" IS 'Total abonado hasta la fecha (numeric 12,2)';
COMMENT ON COLUMN "loan"."due_date" IS 'Fecha límite de pago (opcional)';
COMMENT ON COLUMN "loan"."status" IS 'PENDIENTE | PAGO_PARCIAL | PAGADO';
