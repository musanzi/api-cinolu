# CINOLU API

Backend API for the CINOLU platform. The service is built with **NestJS**, **TypeScript**, **TypeORM**, and **MySQL/MariaDB**.

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

- Node.js 18+
- pnpm
- MySQL or MariaDB

## Installation

```bash
pnpm install
```

## Environment

Create a `.env` file in the project root. Use `.env.example` as the starting point.

```env
PORT=8000

DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=

SESSION_SECRET=
SESSION_MAX_AGE=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/redirect
FRONTEND_URI=http://localhost:4200

SUPPORT_EMAIL=
```

Notes:

- `PORT` defaults to `3000` when it is not provided.
- `SESSION_SECRET` is required for session middleware.
- `SESSION_MAX_AGE` is used as the session cookie lifetime in milliseconds.
- `JWT_SECRET` is required because `JwtModule` uses `getOrThrow('JWT_SECRET')`.
- Static uploads are served from the local `uploads/` directory at `/uploads`.

## Running

```bash
pnpm start:dev
```

The API will listen on the configured `PORT`, commonly:

```text
http://localhost:8000
```

Other runtime commands:

```bash
pnpm start         # Start the app
pnpm start:debug   # Start in debug/watch mode
pnpm build         # Build the application
pnpm start:prod    # Run compiled output from dist/
```

## Scripts

```bash
pnpm build         # Build the application
pnpm format        # Format TypeScript source files
pnpm lint          # Lint and auto-fix files
pnpm start         # Start the application
pnpm start:dev     # Start in watch mode
pnpm start:debug   # Start in debug/watch mode
pnpm start:prod    # Run dist/main
pnpm test          # Run tests
pnpm test:watch    # Run tests in watch mode
pnpm test:cov      # Run tests with coverage
pnpm test:debug    # Run tests with the Node debugger
```

## Database Migrations

Migration files live in:

```text
src/modules/database/migrations/
```

Generate a migration:

```bash
pnpm db:migrate --name=your_migration_name
```

Run pending migrations:

```bash
pnpm db:up
```

Revert the last migration:

```bash
pnpm db:down
```

The migration scripts build the app first, then run the TypeORM CLI against `src/modules/database/orm.config.ts`.

## Project Structure

```text
src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── auth/
│   ├── config/
│   ├── content/
│   │   ├── blog/
│   │   └── highlights/
│   ├── database/
│   ├── email/
│   ├── events/
│   ├── galleries/
│   ├── identity/
│   │   ├── roles/
│   │   └── users/
│   ├── mentors/
│   ├── notifications/
│   ├── opportunities/
│   ├── programs/
│   ├── projects/
│   ├── stats/
│   └── ventures/
└── shared/
    ├── helpers/
    └── interceptors/
```

## Runtime Behavior

- Global validation is enabled with `ValidationPipe`.
- CORS is enabled with credentials support.
- Session middleware is configured with `express-session`.
- Passport is initialized for local, session, JWT, and Google OAuth flows.
- Global guards apply role checks and authentication.
- Responses pass through a global transform interceptor.
- Request logging is handled by `nestjs-pino`.

## License

This project is licensed under the **MIT License**.

## Author

Wilfried M
