# @vibecraft/db

Database layer using Knex.js + PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and set your `DATABASE_URL`
2. Run migrations: `pnpm db:migrate`
3. Seed demo data: `pnpm db:seed`

## Commands

```bash
pnpm db:migrate     # Run pending migrations
pnpm db:rollback    # Rollback last migration
pnpm db:seed        # Seed demo data
pnpm db:reset       # Reset DB (rollback all → migrate → seed)
```

## Tables

| Table                  | Description                       |
| ---------------------- | --------------------------------- |
| `users`                | User accounts (synced from Clerk) |
| `organizations`        | Wedding planning studios          |
| `events`               | Event entities                    |
| `invitation_documents` | Invitation content/blocks         |
| `guests`               | Guest list per event              |
| `check_ins`            | QR check-in records               |
