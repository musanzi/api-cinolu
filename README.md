# OneStop API

Backend API for the OneStop platform. The service is built with **NestJS**, **TypeScript**, **TypeORM**, and **MySQL/MariaDB**.

It powers authentication, identity management, programs, projects, events, opportunities, ventures, mentors, content, notifications, galleries, and dashboard statistics.

## Stack

- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** MySQL/MariaDB
- **ORM:** TypeORM
- **Auth:** Passport, sessions, JWT, Google OAuth
- **Email:** `@nestjs-modules/mailer` + Nodemailer
- **Logging:** `nestjs-pino`
- **Validation:** `class-validator` + `class-transformer`
- **File uploads:** Multer, served from `/uploads`

## Requirements

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose

Node.js, pnpm, and MariaDB do not need to be installed on the host. They run
inside Docker containers.

## Quick Start

```bash
cp .env.example .env
```

Update `.env` with the required values. These database values work with the
MariaDB container provided by the development Compose file:

```env
PORT=8000

DB_HOST=db
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=change-me
DB_NAME=onestop

SESSION_SECRET=change-me
SESSION_MAX_AGE=86400000
JWT_SECRET=change-me
```

Keep `DB_HOST=db`: containers reach MariaDB through its Compose service name,
not through `localhost`.

Build the images and start the development stack:

```bash
docker compose -f compose.dev.yml up --build
```

This starts:

- API: `http://localhost:8000` (or the value configured in `PORT`)
- MariaDB: `localhost:3306`
- Adminer: `http://localhost:8080`

The API source directory is mounted into the container and NestJS runs in watch
mode, so source changes reload automatically.

To start the stack in the background:

```bash
docker compose -f compose.dev.yml -p onestop-backend up --build -d
docker compose -f compose.dev.yml -p onestop-backend logs -f api
```

## Environment

All application configuration is read from the root `.env` file by Docker
Compose and the API container. Start from `.env.example` and configure the
database, mail, session, JWT, Google OAuth, frontend, and support-email values
needed by your environment.

- `PORT` defaults to `3000` when it is not provided.
- `DB_HOST` must be `db` for the bundled MariaDB service.
- `SESSION_SECRET` is required for session middleware.
- `SESSION_MAX_AGE` is used as the session cookie lifetime in milliseconds.
- `JWT_SECRET` is required because `JwtModule` uses `getOrThrow('JWT_SECRET')`.
- Static uploads are available at `/uploads`.

## Development Commands

```bash
# View the running services
docker compose -f compose.dev.yml ps

# Follow API logs
docker compose -f compose.dev.yml -p onestop-backend logs -f api

# Open a shell in the API container
docker compose -f compose.dev.yml -p onestop-backend exec api sh

# Build the application
docker compose -f compose.dev.yml -p onestop-backend exec api pnpm build

# Format the source
docker compose -f compose.dev.yml -p onestop-backend exec api pnpm format

# Lint the source
docker compose -f compose.dev.yml -p onestop-backend exec api pnpm lint

# Stop and remove the containers
docker compose -f compose.dev.yml -p onestop-backend down
```

## Database Migrations

Migration files live in:

```text
src/modules/database/migrations/
```

Generate a migration:

```bash
docker compose -f compose.dev.yml -p onestop-backend exec api pnpm db:migrate --name=your_migration_name
```

Run pending migrations:

```bash
docker compose -f compose.dev.yml -p onestop-backend exec api pnpm db:up
```

Revert the last migration:

```bash
docker compose -f compose.dev.yml -p onestop-backend exec api pnpm db:down
```

The migration scripts build the app first, then run the TypeORM CLI against `src/modules/database/orm.config.ts`.

## Production

The production image builds the NestJS application and installs production
dependencies only. Start it with:

```bash
docker compose -f compose.prod.yml -p onestop-backend up --build -d
docker compose -f compose.prod.yml -p onestop-backend logs -f api
```

In production, MariaDB is not published to the host, and uploaded files and
database data are stored in named Docker volumes.

Stop the production stack without deleting its data:

```bash
docker compose -f compose.prod.yml -p onestop-backend down
```

To inspect the production services:

```bash
docker compose -f compose.prod.yml -p onestop-backend ps
```

## Data Persistence

MariaDB data is stored in the `mariadb_data` named volume. Production uploads
are stored in the `uploads_data` named volume. A normal `docker compose down`
keeps these volumes.

To remove containers and all persisted data for a Compose stack, add
`--volumes` to the `down` command. This permanently deletes that stack's
database data and, in production, uploaded files.

## Runtime Behavior

- Global validation is enabled with `ValidationPipe`.
- CORS is enabled with credentials support.
- Session middleware is configured with `express-session`.
- Passport is initialized for local, session, JWT, and Google OAuth flows.
- Global guards apply role checks and authentication.
- Responses pass through a global transform interceptor.
- Request logging is handled by `nestjs-pino`.
