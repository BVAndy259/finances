# Desarrollo

Guía para trabajar en el monorepo: requisitos, configuración local, scripts, testing y convenciones.

## Requisitos

- **Node.js 22+**
- **pnpm 12+** (`packageManager: pnpm@12.14.0`)
- **PostgreSQL** local o Supabase
- Token de bot de Telegram (`@BotFather`) si vas a usar el bot

## Instalación

```bash
pnpm install
```

## Variables de entorno

Crea un `.env` por paquete a partir de su `.env.example`.

### `apps/api/.env`

```env
BOT_TOKEN=tu_token_de_telegram
TELEGRAM_BOT_USERNAME=kratos_finanzas_bot
BOT_ENABLED=true
PORT=8080
JWT_ACCESS_SECRET=un_secreto_largo_para_access
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=otro_secreto_largo_para_refresh
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:3000
```

### `packages/database/.env`

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DB_LOGGING=false
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> `DATABASE_URL` es una URL PostgreSQL estándar, **no** JDBC. En hosts locales se ignora `sslmode`.

## Puesta en marcha

```bash
# 1. Migraciones
pnpm db:migrate

# 2. Backend
pnpm --filter @expense-tracker/api start:dev

# 3. Frontend (otra terminal)
pnpm --filter @expense-tracker/web dev

# o todo junto con Turborepo
pnpm dev
```

`pnpm dev` **no** ejecuta migraciones automáticamente.

## Scripts

### Raíz (Turborepo)

| Comando | Descripción |
|---|---|
| `pnpm build` | Build de todos los paquetes |
| `pnpm dev` | Desarrollo de todos los paquetes |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests unitarios |
| `pnpm test:e2e` | Tests e2e |
| `pnpm typecheck` | TypeScript |
| `pnpm verify` | Build + lint + typecheck + tests |
| `pnpm db:generate` | Genera migración |
| `pnpm db:migrate` | Aplica migraciones |
| `pnpm db:revert` | Revierte la última migración |
| `pnpm db:show` | Estado de migraciones |
| `pnpm auth:set-credentials` | Vincula credenciales a un usuario existente |

### `apps/api`

| Comando | Descripción |
|---|---|
| `pnpm --filter @expense-tracker/api start:dev` | Watch mode |
| `pnpm --filter @expense-tracker/api build` | Compila a `dist/` |
| `pnpm --filter @expense-tracker/api start:prod` | Ejecuta `dist/main` |
| `pnpm --filter @expense-tracker/api lint` | ESLint con autofix |
| `pnpm --filter @expense-tracker/api test` | Jest |
| `pnpm --filter @expense-tracker/api test:cov` | Cobertura |
| `pnpm --filter @expense-tracker/api test:e2e` | E2E con Supertest |

### `apps/web`

| Comando | Descripción |
|---|---|
| `pnpm --filter @expense-tracker/web dev` | Next.js dev |
| `pnpm --filter @expense-tracker/web build` | Export estático en `out/` |
| `pnpm --filter @expense-tracker/web lint` | ESLint |
| `pnpm --filter @expense-tracker/web typecheck` | `tsc --noEmit` |

### `packages/database`

| Comando | Descripción |
|---|---|
| `migration:generate src/migrations/Nombre` | Genera migración |
| `migration:run` | Aplica migraciones |
| `migration:revert` | Revierte la última |
| `migration:show` | Estado |
| `schema:log` | SQL pendiente entre entidades y BD |

## Testing

| Nivel | Herramienta | Ubicación |
|---|---|---|
| Dominio | Jest | `packages/core/src/**/*.spec.ts` |
| Persistencia | Jest + `pg-mem` | `packages/database/src/**/*.spec.ts`, `apps/api/src/infrastructure/persistence.integration.spec.ts` |
| Casos de uso | Jest + mocks de puertos | `apps/api/src/application/usecase/*.spec.ts` |
| Controllers/servicios | Jest | `apps/api/src/interfaces/controllers/*.spec.ts` |
| E2E | Jest + Supertest | `apps/api/test/` |

`pg-mem` cubre la lógica de repositorios, pero **no** valida migraciones reales. El CI levanta PostgreSQL 17 y ejecuta `migration:run` para cubrir esa parte, además de construir y arrancar la imagen Docker.

## CI

`.github/workflows/ci.yml` valida en cada push/PR:

1. `lint`, `typecheck`, `build`.
2. Migraciones reales + `migration:show` sobre PostgreSQL 17.
3. Tests unitarios y e2e.
4. `docker build`, arranque del contenedor y `GET /health`.

## Convenciones

- **Sin comentarios innecesarios** en el código; el nombre debe explicar el propósito.
- **TypeScript estricto**; no usar `any` salvo en bordes justificados.
- **Dinero:** siempre `Decimal` en dominio y `string` en API.
- **Dominio aislado:** `core` no importa Nest, TypeORM ni `database`.
- **Dependencias:** respetar la dirección `shared → core → database → api`; el frontend solo consume `shared` y la API.
- **Validación:** DTOs con `class-validator`; formularios con Zod.
- **Errores de negocio:** lanzar `BusinessRuleError` en dominio, no excepciones HTTP.
- **Migraciones:** nunca activar `synchronize`; generar y revisar el SQL.
- **Commits/PR:** no se hace commit ni push sin pedirlo explícitamente.

## Solución de problemas

| Problema | Causa / solución |
|---|---|
| `Falta DATABASE_URL` | Crear `packages/database/.env` (el paquete carga su propio `.env`). |
| Error SSL en local | Usar `localhost`; `sslmode` se elimina automáticamente. |
| `Faltan variables de entorno obligatorias` | Configurar `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (y `BOT_TOKEN` si el bot está activo). |
| Bot no arranca | `BOT_ENABLED=true` requiere `BOT_TOKEN` válido. |
| CORS bloqueado | Añadir el origen exacto del frontend a `CORS_ORIGINS`. |
| Cookie de refresh no persiste | En cross-site usar `COOKIE_SECURE=true` y HTTPS. |
| Migración UUID falla | Restaurar backup; `ConvertIdsToUuid.down()` no revierte. |
| Frontend sin datos | Verificar `NEXT_PUBLIC_API_URL` en tiempo de build y CORS en la API. |

## Roadmap

- [x] Base del frontend Next.js (auth, dashboard y keep-alive).
- [x] Página de cuentas (CRUD).
- [x] Página de transacciones (filtros, gastos, ingresos y transferencias).
- [x] Página de préstamos (listado, creación y abonos).
- [x] CI con migraciones reales, tests y verificación Docker.
- [x] UUID como identificadores.
- [x] Autenticación JWT con refresh tokens.
- [ ] Comando `/resumen` para reportes mensuales.
- [ ] Exportación de datos a Excel mediante `/exportar`.
