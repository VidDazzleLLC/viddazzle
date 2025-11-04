# Database Migrations

This directory contains SQL migration files for the VidDazzle database.

## Quick Start

To run all pending migrations:

```bash
npm run migrate
```

This will automatically apply any missing database schema changes.

## Available Migrations

### `social-listening-schema.sql`

Creates the complete database schema for the Social Media Listening & Outreach feature, including:

- **`listening_campaigns`** - Campaign configurations for social listening
- **`social_mentions`** - Detected social media posts and mentions
- **`outreach_rules`** - Automated outreach rule definitions
- **`outreach_messages`** - Generated outreach messages for approval/sending
- **`platform_credentials`** - Encrypted social media platform credentials

## How It Works

The migration runner (`scripts/run-migrations.ts`) will:

1. Check your database connection (uses `DATABASE_URL` or `POSTGRES_URL` from `.env`)
2. Verify which tables already exist
3. Run only the migrations needed for missing tables
4. Show you table statistics after completion

## Running Migrations Manually

If you need to run a specific migration file manually:

```bash
# Using psql
psql $DATABASE_URL -f migrations/social-listening-schema.sql

# Using the migration script
tsx scripts/run-migrations.ts
```

## Troubleshooting

### Error: "Could not find the table 'public.platform_credentials'"

This error means the social listening migration hasn't been run yet. Simply run:

```bash
npm run migrate
```

### Error: "Missing DATABASE_URL"

Make sure your `.env` file contains either:
- `DATABASE_URL` - for PostgreSQL/Neon/Railway connections
- `POSTGRES_URL` - alternative PostgreSQL URL format

Example:
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Tables Already Exist

If you see "Social listening tables already exist", this means your database is already up to date. No action needed!

## Database Requirements

The migrations require:
- PostgreSQL 12 or higher
- UUID extension (automatically enabled by the migration)
- Write permissions to create tables, indexes, and triggers

## For Production

When deploying to production:

1. **Railway/Render**: Run `npm run migrate` as a release command
2. **Vercel**: Run migrations manually using your database CLI
3. **Docker**: Add `npm run migrate` to your startup script

## Creating New Migrations

To create a new migration:

1. Create a new `.sql` file in the `migrations/` directory
2. Use descriptive naming: `feature-name-schema.sql`
3. Include `CREATE TABLE IF NOT EXISTS` to make migrations idempotent
4. Update the migration runner if needed to include the new file

## Migration Safety

All migrations use:
- `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- `CREATE INDEX IF NOT EXISTS` (PostgreSQL 9.5+) - prevents duplicate indexes
- Proper foreign key constraints with cascade rules

This ensures migrations are **idempotent** and safe to run repeatedly.
