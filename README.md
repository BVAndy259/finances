# Gestor de Finanzas - Telegram Bot

Bot de Telegram para el registro y gestión de finanzas personales (gastos, ingresos, transferencias y préstamos). Backend en TypeScript con NestJS y arquitectura hexagonal.

## Tecnologías

- **Runtime:** Node.js 22+.
- **Gestor de paquetes:** pnpm 12+.
- **Framework:** NestJS 11.
- **Lenguaje:** TypeScript 5.
- **Persistencia:** TypeORM + PostgreSQL (Supabase).
- **Bot:** grammY con Long Polling.
- **Dinero:** `decimal.js` para aritmética decimal exacta.
- **Testing:** Jest + Supertest.
- **Contenedores:** Docker multi-stage.

## Arquitectura hexagonal

```
src/
  domain/
    model/                     # Entidades de dominio (sin dependencias de infraestructura)
    port/out/                  # Puertos de salida (repositorios, UnitOfWork)
    errors/
  application/
    usecase/                   # Casos de uso (servicios de aplicación)
  infrastructure/
    out/persistence/typeorm/   # Adaptadores de salida: entidades, mappers, repositorios, migraciones
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

1. Instala dependencias:
   ```bash
   pnpm install
   ```

2. Crea un archivo `.env` a partir de `.env.example`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   BOT_TOKEN=tu_token_de_telegram
   TELEGRAM_BOT_USERNAME=kratos_finanzas_bot
   PORT=8080
   ```

   `DATABASE_URL` debe ser una URL estándar de PostgreSQL, **no** una URL JDBC. Si apunta a `localhost`, el parámetro `sslmode` se ignora automáticamente para permitir conexiones locales sin SSL.

3. Ejecuta las migraciones:
   ```bash
   pnpm migration:run
   ```

4. Arranca en desarrollo:
   ```bash
   pnpm start:dev
   ```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm start:dev` | Servidor en modo watch |
| `pnpm build` | Compila a `dist/` |
| `pnpm start:prod` | Ejecuta `dist/main.js` |
| `pnpm lint` | ESLint con autofix |
| `pnpm test` | Tests unitarios |
| `pnpm test:e2e` | Tests e2e |
| `pnpm migration:generate src/infrastructure/out/persistence/typeorm/migrations/Nombre` | Genera migración |
| `pnpm migration:run` | Aplica migraciones |
| `pnpm migration:revert` | Revierte la última migración |
| `pnpm migration:show` | Muestra el estado de las migraciones |
| `pnpm schema:log` | Muestra el SQL pendiente entre entidades y BD |

## Migraciones y base de datos existente

La migración inicial es idempotente: crea las tablas si no existen y agrega las columnas `paid_amount` y `due_date` si faltan. El esquema refleja el script SQL original, por lo que los campos que permiten `NULL` en la base de datos se mantienen así; los mappers validan los invariantes de negocio al convertir a dominio.

Para verificar diferencias contra una base existente:

```bash
pnpm schema:log
```

## Docker

```bash
docker build -t expense-tracker .
docker run --env-file .env -p 8080:8080 expense-tracker
```

El contenedor aplica las migraciones pendientes antes de arrancar la aplicación.

## Despliegue en Render

1. Conecta el repositorio como Web Service.
2. Render detectará el `Dockerfile`.
3. Configura las variables de entorno:
   - `DATABASE_URL`
   - `BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME` (opcional)
   - `PORT` (opcional, por defecto `8080`)
4. El despliegue se ejecuta automáticamente desde la rama configurada.

## Migración desde Java

El código Java original se conserva temporalmente en `legacy-java/` para comparar comportamiento. Se eliminará cuando se valide la paridad funcional completa.

## Roadmap

- [ ] Comando `/resumen` para reportes mensuales.
- [ ] Exportación de datos a Excel mediante `/exportar`.
