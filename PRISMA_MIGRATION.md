# Prisma Migration Guide for Production

## Before First Deployment

The Prisma schema is already configured for PostgreSQL. No changes needed to `prisma/schema.prisma`.

## Running Migrations on Vercel

**IMPORTANT**: Migrations are NOT run automatically during build. You must run them manually after first deployment.

This is because:
- Database connections during build can fail due to network/firewall issues
- Connection pooler URLs work better for serverless environments
- Manual migration gives you control over when migrations run

## Manual Migration (if needed)

If you need to run migrations manually after deployment:

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull production environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

### Option 2: Using Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Find your latest migration in `prisma/migrations/[timestamp]_init/migration.sql`
3. Copy and paste the SQL into the editor
4. Run the query

### Option 3: Direct Database Connection

```bash
# Set DATABASE_URL in your terminal
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy
```

## Verifying Migrations

After deployment, verify tables were created:

1. Go to Supabase Dashboard → Table Editor
2. You should see:
   - `User`
   - `DayEntry`
   - `TimeBlock`

## Troubleshooting

### Error: "Migration engine failed to connect"

- Check `DATABASE_URL` is correct
- Verify database is not paused in Supabase
- Check network connectivity

### Error: "Migration already applied"

- This is normal if migrations ran during build
- Check Supabase Table Editor to verify tables exist

### Error: "Schema drift detected"

- Your local schema differs from production
- Run `npx prisma migrate diff` to see differences
- Create a new migration if needed

