# Gestor de Finanzas - Telegram Bot

Un bot de Telegram diseñado para el registro y gestión de finanzas personales (gastos, ingresos y préstamos). Construido con una arquitectura robusta orientada a microservicios, desplegado en la nube con contenedores y respaldado por una base de datos relacional.

## Tecnologías y Arquitectura

Este proyecto fue desarrollado aplicando patrones de diseño de software y metodologías de integración continua:

*   **Backend:** Java 21+ con Spring Boot (v4.x).
*   **Persistencia:** Spring Data JPA (Hibernate) para el mapeo objeto-relacional (ORM).
*   **Base de Datos:** PostgreSQL alojado en **Supabase** (configurado con *Session Pooler* para optimización de conexiones JDBC).
*   **API:** Telegram Bots API (Long Polling).
*   **Contenedorización:** Docker (Dockerfile personalizado de múltiples etapas para compilación y ejecución).
*   **Despliegue (CI/CD):** Render (Web Service) con despliegue automático desde la rama `master`.
*   **Utilidades:** Lombok (para reducción de boilerplate con constructores y patrón Builder).

## Características Principales (Features)

*   **Gestión Multicuenta:** Soporte para registrar transacciones divididas por cuentas (Ej: Yape, Efectivo, Lemon Cash, Ahorros).
*   **Registro de Transacciones:** Flujo conversacional en Telegram para ingresar gastos e ingresos indicando monto y concepto.
*   **Sistema Anti-Suspensión (Keep-Alive):** Endpoint REST interno (`/`) acoplado a un cron-job externo para evitar que el contenedor entre en modo *sleep* en el *free tier* de Render, garantizando disponibilidad 24/7.
*   **Seguridad:** Uso de variables de entorno para la protección de credenciales (Tokens, Passwords) y gestión de perfiles de Spring (`dev` y `prod`).

## Instalación y Configuración Local

Si deseas correr este proyecto en tu entorno de desarrollo local, sigue estos pasos:

### Prerequisitos
*   Java Development Kit (JDK) 21 o superior.
*   Maven instalado.
*   Una instancia de PostgreSQL (Local o en Supabase).
*   Un Token de bot de Telegram (obtenido a través de `@BotFather`).

### Configuración del Entorno

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/finances.git](https://github.com/tu-usuario/finances.git)
   cd finances
   ```
2. Configura las variables de entorno para tu perfil de desarrollo. Puedes usar tu terminal (PowerShell o CMD) antes de arrancar la aplicación, o configurar el archivo application-dev.properties (asegúrate de NO subir tus credenciales a GitHub):
    ```bash
   spring.profiles.active=dev
   DB_URL=jdbc:postgresql://localhost:5432/tu_base_de_datos
   DB_USER=postgres
   DB_PASSWORD=tu_password
   BOT_TOKEN=tu_token_de_telegram
    ```
3. Compila y ejecuta el proyecto:
    ```bash
    mvn clean package
    mvn spring-boot:run
    ```
   
## Despliegue en Producción (Render)
El proyecto está preparado para ser desplegado automáticamente.
1. Conecta el repositorio a Render creando un nuevo Web Service.
2. Render detectará automáticamente el Dockerfile.
3. En la configuración avanzada, define las siguientes Variables de Entorno:
    - `DB_URL`: URL de tu base de datos PostgreSQL en Supabase.
    - `DB_USER`: Usuario de la base de datos.
    - `DB_PASSWORD`: Contraseña de la base de datos.
    - `BOT_TOKEN`: Token del bot de Telegram

## Próximos Pasos (Roadmap)
* [ ] Implementar el comando /resumen para generar reportes mensuales.
* [ ] Habilitar exportación de datos a Excel (Apache POI) mediante el comando /exportar.

_Desarrollado aplicando principios de Ingeniería de Software._