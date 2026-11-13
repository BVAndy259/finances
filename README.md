# Gestor de Finanzas

Monorepo con Turborepo para el registro y gestión de finanzas personales (gastos, ingresos, transferencias y préstamos). Incluye el backend en NestJS con arquitectura hexagonal y un bot de Telegram; próximamente un frontend en Next.js.

## Estructura

```
apps/
  api/                 # Backend NestJS + bot de Telegram (casos de uso e interfaces)
  web/                 # Frontend Next.js (pendiente)
packages/
  core/                # Dominio: modelos, puertos y errores
  database/            # Persistencia TypeORM: entidades, mappers, adapters, migraciones y DataSource
  shared/              # Tipos y utilidades compartidas
turbo.json
pnpm-workspace.yaml
Dockerfile             # Imagen del backend (contexto: raíz del repo)
```

Grafo de dependencias: `shared` → `core` → `database` → `api`. El paquete `database` implementa los puertos definidos en `core`; `apps/api` solo orquesta casos de uso e interfaces.

## Tecnologías

- **Runtime:** Node.js 22+.
- **Gestor de paquetes:** pnpm 12+.
- **Monorepo:** Turborepo 2.
- **Framework:** NestJS 11.
- **Lenguaje:** TypeScript 5.
- **Persistencia:** TypeORM + PostgreSQL (Supabase).
- **Bot:** grammY con Long Polling.
- **Dinero:** `decimal.js` para aritmética decimal exacta.
- **Testing:** Jest + Supertest.
- **Contenedores:** Docker multi-stage.

## Arquitectura hexagonal

```
packages/core/src/
  model/                       # Entidades de dominio (sin dependencias de infraestructura)
  port/out/                    # Puertos de salida (repositorios, UnitOfWork)
  errors/
packages/database/src/
  entities/                    # Entidades TypeORM
  mappers/                     # Conversión dominio ↔ persistencia
  adapters/                    # Implementación de los puertos
  migrations/                  # Migraciones
  data-source.ts               # DataSource para el CLI de TypeORM
apps/api/src/
  application/
    usecase/                   # Casos de uso (servicios de aplicación)
  interfaces/
    bot/                       # Adaptador de entrada: bot de Telegram y handlers
    controllers/               # Adaptador de entrada: HTTP (keep-alive)
```

El flujo de dependencias apunta hacia el dominio: los casos de uso solo conocen puertos, y la infraestructura implementa esos puertos con TypeORM.

### Equivalencias con la versión Java

| Java / Spring Boot | TypeScript / NestJS |
|---|---|
| `@Service` / `@Component` | `@Injectable()` + módulos de Nest |
| `JpaRepository` | `Repository<T>` de TypeORM |
| Entidades JPA + mappers | Entidades TypeORM + mappers |
| `@Transactional` | Puerto `UnitOfWork` + `DataSource.transaction` |
| `BigDecimal` | `decimal.js` |
| `TelegramLongPollingBot` | `grammY` |
| `@RestController` | `@Controller` |

## Características

- Gestión multicuenta (Yape, Efectivo, BCP, Ahorros, etc.).
- Registro conversacional de gastos, ingresos y transferencias.
- Préstamos con abonos parciales, deuda restante y fecha límite.
- Reporte de cuentas y saldo total.
- Endpoint `GET /` para keep-alive en Render.

## Requisitos

- Node.js 22 o superior.
- pnpm 12 o superior.
- PostgreSQL (local o Supabase).
- Token de bot de Telegram (`@BotFather`).

## Configuración local

1. Instala dependencias desde la raíz:
   ```bash
   pnpm install
   ```

2. Crea un `.env` por paquete a partir de su `.env.example`:

   `apps/api/.env`:
   ```env
   BOT_TOKEN=tu_token_de_telegram
   TELEGRAM_BOT_USERNAME=kratos_finanzas_bot
   BOT_ENABLED=true
   PORT=8080
   ```

   `packages/database/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   DB_LOGGING=false
   ```

   `DATABASE_URL` debe ser una URL estándar de PostgreSQL, **no** una URL JDBC. Si apunta a `localhost`, el parámetro `sslmode` se ignora automáticamente para permitir conexiones locales sin SSL. El paquete `database` carga su propio `.env`, por lo que no duplica variables en la API.

3. Ejecuta las migraciones:
   ```bash
   pnpm --filter @expense-tracker/database migration:run
   ```

4. Arranca el backend en desarrollo:
   ```bash
   pnpm --filter @expense-tracker/api start:dev
   ```

## Scripts

### Raíz (Turborepo)

| Comando | Descripción |
|---|---|
| `pnpm build` | Build de todos los paquetes |
| `pnpm dev` | Modo desarrollo de todos los paquetes |
| `pnpm lint` | ESLint en todos los paquetes |
| `pnpm test` | Tests unitarios de todos los paquetes |
| `pnpm typecheck` | Typecheck de todos los paquetes |

### API (`apps/api`)

| Comando | Descripción |
|---|---|
| `pnpm --filter @expense-tracker/api start:dev` | Servidor en modo watch |
| `pnpm --filter @expense-tracker/api build` | Compila a `apps/api/dist` |
| `pnpm --filter @expense-tracker/api start:prod` | Ejecuta `dist/main.js` |
| `pnpm --filter @expense-tracker/api lint` | ESLint con autofix |
| `pnpm --filter @expense-tracker/api test` | Tests unitarios |
| `pnpm --filter @expense-tracker/api test:e2e` | Tests e2e |

### Base de datos (`packages/database`)

| Comando | Descripción |
|---|---|
| `pnpm --filter @expense-tracker/database migration:generate src/migrations/Nombre` | Genera migración |
| `pnpm --filter @expense-tracker/database migration:run` | Aplica migraciones |
| `pnpm --filter @expense-tracker/database migration:revert` | Revierte la última migración |
| `pnpm --filter @expense-tracker/database migration:show` | Muestra el estado de las migraciones |
| `pnpm --filter @expense-tracker/database schema:log` | Muestra el SQL pendiente entre entidades y BD |

## Migraciones y base de datos existente

La migración inicial es idempotente: crea las tablas si no existen y agrega las columnas `paid_amount` y `due_date` si faltan. El esquema refleja el script SQL original, por lo que los campos que permiten `NULL` en la base de datos se mantienen así; los mappers validan los invariantes de negocio al convertir a dominio.

La migración `ConvertIdsToUuid` convierte las claves primarias y foráneas de `bigint` a `uuid` preservando los datos existentes. **Haz un backup antes de ejecutarla**: su `down()` no revierte automáticamente la conversión.

Para verificar diferencias contra una base existente:

```bash
pnpm --filter @expense-tracker/database schema:log
```

## Docker

El `Dockerfile` vive en la raíz porque necesita el contexto completo del monorepo:

```bash
docker build -t expense-tracker .
docker run --env-file apps/api/.env --env-file packages/database/.env -p 8080:8080 expense-tracker
```

El contenedor aplica las migraciones pendientes antes de arrancar la aplicación.

## Despliegue en Render

1. Conecta el repositorio como Web Service.
2. Usa la raíz del repositorio como contexto y el `Dockerfile` de la raíz.
3. Configura las variables de entorno:
   - `DATABASE_URL`
   - `BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME` (opcional)
   - `PORT` (opcional, por defecto `8080`)
4. El despliegue se ejecuta automáticamente desde la rama configurada.

## Migración desde Java

El código Java original se conserva temporalmente en `legacy-java/` para comparar comportamiento. Se eliminará cuando se valide la paridad funcional completa.

## Roadmap

- [ ] Frontend Next.js (`apps/web`).
- [x] UUID como identificadores.
- [ ] Autenticación JWT.
- [ ] Comando `/resumen` para reportes mensuales.
- [ ] Exportación de datos a Excel mediante `/exportar`.
