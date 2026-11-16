# API HTTP

Base URL local: `http://localhost:8080`. En producción, el dominio del Web Service de Render.

## Convenciones

- **Auth:** todas las rutas salvo las marcadas como públicas requieren `Authorization: Bearer <accessToken>`.
- **IDs:** UUID (`ParseUUIDPipe` responde `400` si el formato es inválido).
- **Montos:** se envían y reciben como **string** con hasta 2 decimales (`^\d+(\.\d{1,2})?$`). Nunca como número.
- **Ownership:** las cuentas, transacciones y préstamos se validan contra el usuario autenticado.
- **Fechas:** ISO 8601 (`2026-11-16T00:00:00.000Z`). El mes de dashboard usa `YYYY-MM`.
- **Respuestas vacías:** `204 No Content` en eliminaciones, logout y transferencias.

### Formato de error

```json
{
  "statusCode": 400,
  "message": "Saldo insuficiente en la cuenta: Efectivo",
  "error": "Bad Request"
}
```

En errores de validación, `message` puede ser un array de strings.

---

## Autenticación

### `POST /auth/register` (público)

```json
{
  "email": "ana@example.com",
  "password": "secreto123",
  "alias": "Ana"
}
```

- Crea el usuario, hashea la contraseña con Argon2id y crea la cuenta `Efectivo`.
- Devuelve `201` con `{ accessToken, user }` y setea la cookie `refresh_token`.

```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "ana@example.com",
    "telegramChatId": null,
    "alias": "Ana",
    "createdAt": "2026-11-16T12:00:00.000Z"
  }
}
```

### `POST /auth/login` (público)

```json
{ "email": "ana@example.com", "password": "secreto123" }
```

Devuelve `200` con `{ accessToken, user }` y cookie de refresh. `401` si las credenciales son inválidas.

### `POST /auth/refresh` (público)

Toma el refresh token de la cookie `refresh_token` o del body:

```json
{ "refreshToken": "opcional-si-no-hay-cookie" }
```

Rota el token y devuelve `200` con un nuevo `accessToken` y `user`.

### `POST /auth/logout` (Bearer)

Revoca el refresh token y limpia la cookie. Responde `204`.

### `GET /auth/me` (Bearer)

Devuelve el perfil público:

```json
{
  "id": "uuid",
  "email": "ana@example.com",
  "telegramChatId": null,
  "alias": "Ana",
  "createdAt": "2026-11-16T12:00:00.000Z"
}
```

### `PATCH /auth/credentials` (Bearer)

```json
{
  "currentPassword": "secreto123",
  "email": "nuevo@example.com",
  "newPassword": "otraClave456"
}
```

- Al menos uno de `email` o `newPassword` es obligatorio.
- `currentPassword` es obligatorio; `401` si no coincide.
- Devuelve nuevos tokens y cookie.

---

## Cuentas

### `GET /accounts`

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Efectivo",
    "balance": "150.00",
    "currency": "PEN",
    "createdAt": "2026-11-16T12:00:00.000Z"
  }
]
```

### `POST /accounts`

```json
{ "name": "Yape", "currency": "PEN" }
```

`currency` es opcional (3 letras, default `PEN`). Responde `201` con la cuenta creada.

### `GET /accounts/:id`

Detalle de una cuenta. `404` si no existe o es de otro usuario.

### `PATCH /accounts/:id`

```json
{ "name": "BCP Ahorros", "currency": "USD" }
```

Ambos campos opcionales; responde la cuenta actualizada.

### `DELETE /accounts/:id`

Responde `204`. Devuelve `409` si la cuenta tiene transacciones o préstamos asociados.

---

## Transacciones

### `GET /transactions`

Query params (todos opcionales):

| Parámetro | Tipo | Descripción |
|---|---|---|
| `accountId` | UUID | Filtra por cuenta |
| `type` | enum | `INGRESO`, `EGRESO`, `TRANSFERENCIA_SALIDA`, `TRANSFERENCIA_ENTRADA`, `EGRESO_PRESTAMO`, `INGRESO_COBRO` |
| `from` | ISO date | Desde (inclusive) |
| `to` | ISO date | Hasta (inclusive) |
| `page` | int ≥ 1 | Default `1` |
| `limit` | int 1–100 | Default `20` |

```json
{
  "items": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "transactionType": "EGRESO",
      "amount": "25.50",
      "description": "Almuerzo",
      "location": "Web",
      "transactionDate": "2026-11-16T13:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

`400` si `from > to`.

### `POST /transactions/expense`

```json
{
  "accountId": "uuid",
  "amount": "25.50",
  "description": "Almuerzo",
  "location": "Web"
}
```

Descuenta saldo y crea un `EGRESO`. `location` opcional (default `Web`). `400` si el saldo es insuficiente.

### `POST /transactions/income`

Mismo cuerpo que expense. Incrementa saldo y crea un `INGRESO`.

### `POST /transactions/transfer`

```json
{
  "originAccountId": "uuid",
  "destinationAccountId": "uuid",
  "amount": "100.00",
  "description": "Ahorro del mes",
  "location": "Web"
}
```

Valida cuentas distintas y saldo suficiente. Crea `TRANSFERENCIA_SALIDA` y `TRANSFERENCIA_ENTRADA` en una única transacción. Responde `204`.

### `GET /transactions/:id`

Devuelve la transacción. `404` si no existe o no pertenece a una cuenta del usuario.

---

## Préstamos

### `GET /loans`

Query opcional `status`: `PENDIENTE`, `PAGO_PARCIAL`, `PAGADO`.

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "accountId": "uuid",
    "debtorName": "Juan",
    "amount": "100.00",
    "paidAmount": "30.00",
    "remainingAmount": "70.00",
    "dueDate": "2026-12-25",
    "status": "PAGO_PARCIAL",
    "loanDate": "2026-11-10T09:00:00.000Z"
  }
]
```

### `POST /loans`

```json
{
  "accountId": "uuid",
  "amount": "100.00",
  "debtorName": "Juan",
  "description": "Para el taxi",
  "dueDate": "2026-12-25"
}
```

`dueDate` opcional. Descuenta de la cuenta, crea `EGRESO_PRESTAMO` y el préstamo. `400` si no hay saldo.

### `GET /loans/:id`

Detalle del préstamo. `404` si no pertenece al usuario.

### `POST /loans/:id/payments`

```json
{ "accountId": "uuid", "amount": "30.00" }
```

Registra un abono: suma a la cuenta, crea `INGRESO_COBRO` y actualiza `paidAmount`/`status`. `400` si el préstamo está pagado o el abono supera la deuda.

---

## Dashboard

### `GET /dashboard/summary`

Query opcional `month=YYYY-MM` (default: mes actual). Devuelve:

```json
{
  "month": "2026-11",
  "totalBalance": "1200.00",
  "income": "800.00",
  "expense": "350.50",
  "net": "449.50",
  "accounts": [
    { "id": "uuid", "name": "Efectivo", "balance": "500.00", "currency": "PEN" }
  ],
  "recentTransactions": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "transactionType": "EGRESO",
      "amount": "25.50",
      "description": "Almuerzo",
      "location": "Web",
      "transactionDate": "2026-11-16T13:30:00.000Z"
    }
  ],
  "loans": {
    "total": "70.00",
    "count": 1,
    "items": [
      {
        "id": "uuid",
        "accountId": "uuid",
        "debtorName": "Juan",
        "amount": "100.00",
        "paidAmount": "30.00",
        "remainingAmount": "70.00",
        "dueDate": "2026-12-25",
        "status": "PAGO_PARCIAL",
        "loanDate": "2026-11-10T09:00:00.000Z"
      }
    ]
  }
}
```

`400` si `month` no cumple `YYYY-MM`.

---

## Estado del servicio

### `GET /health` (público)

```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2026-11-16T12:00:00.000Z",
  "database": "up"
}
```

Responde `200` con la base disponible y `503` si no responde (mismo cuerpo con `status: "degraded"` y `database: "down"`).

### `GET /` (público)

Texto plano de keep-alive legado.

---

## Resumen de rutas

| Método | Ruta | Auth |
|---|---|---|
| `POST` | `/auth/register` | Público |
| `POST` | `/auth/login` | Público |
| `POST` | `/auth/refresh` | Público |
| `POST` | `/auth/logout` | Bearer |
| `GET` | `/auth/me` | Bearer |
| `PATCH` | `/auth/credentials` | Bearer |
| `GET` | `/accounts` | Bearer |
| `POST` | `/accounts` | Bearer |
| `GET` | `/accounts/:id` | Bearer |
| `PATCH` | `/accounts/:id` | Bearer |
| `DELETE` | `/accounts/:id` | Bearer |
| `GET` | `/transactions` | Bearer |
| `POST` | `/transactions/expense` | Bearer |
| `POST` | `/transactions/income` | Bearer |
| `POST` | `/transactions/transfer` | Bearer |
| `GET` | `/transactions/:id` | Bearer |
| `GET` | `/loans` | Bearer |
| `POST` | `/loans` | Bearer |
| `GET` | `/loans/:id` | Bearer |
| `POST` | `/loans/:id/payments` | Bearer |
| `GET` | `/dashboard/summary` | Bearer |
| `GET` | `/health` | Público |
| `GET` | `/` | Público |
