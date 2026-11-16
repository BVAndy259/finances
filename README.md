# Gestor de Finanzas

Monorepo para el registro y gestión de finanzas personales: gastos, ingresos, transferencias y préstamos. Incluye una API en **NestJS** con arquitectura hexagonal, un **bot de Telegram**, un frontend en **Next.js** y persistencia en **PostgreSQL**.

## Características

- Gestión multicuenta (Yape, Efectivo, BCP, Ahorros, etc.).
- Registro de gastos, ingresos y transferencias desde la web o el bot.
- Préstamos con abonos parciales, deuda restante y fecha límite.
- Dashboard con saldo total, ingresos, egresos, neto del mes y préstamos pendientes.
- Autenticación con JWT y refresh tokens rotativos.
- Bot de Telegram con flujo conversacional.
- API con validación de reglas de negocio y ownership por usuario.
- Export estático del frontend para CDN.

## Stack

| Área | Tecnología |
|---|---|
| Monorepo | pnpm workspaces + Turborepo 2 |
| Backend | NestJS 11 + TypeScript 5 |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 |
| Datos en frontend | TanStack Query + React Hook Form + Zod |
| Persistencia | TypeORM + PostgreSQL (Supabase) |
| Bot | grammY (long polling) |
| Dinero | `decimal.js` |
| Auth | Argon2id + JWT (access/refresh) |
| Testing | Jest + Supertest + `pg-mem` |
| Contenedores | Docker multi-stage |

## Estructura

```
apps/
  api/                 # Backend NestJS + bot de Telegram
  web/                 # Frontend Next.js
packages/
  core/                # Dominio: modelos, puertos y errores
  database/            # TypeORM: entidades, mappers, adaptadores, migraciones
  shared/              # Tipos y constantes compartidas
docs/                  # Documentación detallada
Dockerfile             # Imagen del backend (contexto: raíz del repo)
render.yaml            # Web Service opcional en Render
turbo.json
pnpm-workspace.yaml
```

Grafo de dependencias: `shared → core → database → api`. El frontend (`apps/web`) consume `shared` y la API REST.

## Arquitectura

- `packages/core` define modelos de dominio y puertos de salida sin depender de infraestructura.
- `packages/database` implementa esos puertos con TypeORM y mappers.
- `apps/api` orquesta casos de uso y expone adaptadores de entrada (HTTP y Telegram).
- El dinero usa `Decimal` en el dominio y `numeric` en PostgreSQL; la API lo expone como string.
- Las operaciones compuestas usan un `UnitOfWork` transaccional basado en `AsyncLocalStorage`.

Detalle completo en [Arquitectura](docs/architecture.md).

## Requisitos

- Node.js 22+
- pnpm 12+
- PostgreSQL (local o Supabase)
- Token de bot de Telegram (`@BotFather`), opcional si `BOT_ENABLED=false`

## Inicio rápido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear los .env a partir de los .env.example
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Aplicar migraciones
pnpm db:migrate

# 4. Arrancar backend y frontend (o `pnpm dev` para ambos)
pnpm --filter @expense-tracker/api start:dev
pnpm --filter @expense-tracker/web dev
```

Variables mínimas:

```env
# apps/api/.env
BOT_ENABLED=false
JWT_ACCESS_SECRET=un_secreto_largo
JWT_REFRESH_SECRET=otro_secreto_largo
CORS_ORIGINS=http://localhost:3000

# packages/database/.env
DATABASE_URL=postgresql://user:password@localhost:5432/database

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> `pnpm dev` no ejecuta migraciones automáticamente. `DATABASE_URL` debe ser una URL PostgreSQL estándar (no JDBC).

Si ya tienes datos creados desde Telegram y quieres acceder desde la web:

```bash
pnpm auth:set-credentials
```

El comando vincula email/contraseña al mismo usuario sin crear otro.

## Scripts principales

| Comando | Descripción |
|---|---|
| `pnpm dev` | Desarrollo de todos los paquetes |
| `pnpm build` | Build completo |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Tests unitarios |
| `pnpm test:e2e` | Tests e2e |
| `pnpm verify` | Build + lint + typecheck + tests |
| `pnpm db:migrate` | Aplica migraciones |
| `pnpm db:show` | Estado de migraciones |
| `pnpm auth:set-credentials` | Vincula credenciales web a un usuario existente |

Lista completa en [Desarrollo](docs/development.md).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/README.md](docs/README.md) | Índice general |
| [Arquitectura](docs/architecture.md) | Hexagonal, dependencias, flujos y decisiones |
| [Backend](docs/backend.md) | Módulos, casos de uso, auth y bot |
| [API HTTP](docs/api.md) | Endpoints, cuerpos, respuestas y errores |
| [Frontend](docs/frontend.md) | Rutas, componentes, estado y build estático |
| [Base de datos](docs/database.md) | Esquema, entidades, mappers y migraciones |
| [Despliegue](docs/deployment.md) | Docker, Render, Cloudflare Pages y CI |
| [Desarrollo](docs/development.md) | Setup, scripts, testing y convenciones |

Recursos de base de datos: [schema.sql](docs/database/schema.sql), [finance.dbml](docs/database/finance.dbml) y [diagrama ER](docs/database/er-diagram.png).

## Despliegue

- **Backend:** Docker en Render (health check `/health`).
- **Frontend:** export estático en Cloudflare Pages.
- **Base de datos:** PostgreSQL en Supabase.
- **Keep-alive:** cron externo a `/health` cada 5–10 minutos.

Instrucciones detalladas en [Despliegue](docs/deployment.md).

## CI

El workflow `.github/workflows/ci.yml` ejecuta lint, typecheck, build, migraciones reales sobre PostgreSQL 17, tests unitarios/e2e y verificación Docker con `GET /health` en cada push/PR.

## Estado

Proyecto en desarrollo activo. Consulta el [roadmap](docs/development.md#roadmap).

## Licencia

UNLICENSED — uso privado.
