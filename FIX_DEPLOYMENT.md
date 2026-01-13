# Fix Deployment Database Connection Issue

## Problem
The build is failing with:
```
Error: P1001: Can't reach database server at `db.hznyjskijavihatjhhni.supabase.co:5432`
```

## Solution

### 1. Use Connection Pooling URL

In Vercel environment variables, make sure you're using the **Connection Pooling** URL, not the direct connection URL.

**Correct format (Transaction Pooler):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Or Session Pooler:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Wrong (Direct Connection - causes build failures):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2. Get the Correct URL from Supabase

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to "Connection string"
3. Select **"Transaction"** or **"Session"** mode (NOT "Direct connection")
4. Copy the URI format
5. Paste it into Vercel environment variables

### 3. Migrations Don't Run During Build

Migrations have been removed from the build process. You need to run them manually after deployment:

```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

Or use Supabase SQL Editor to run the migration SQL manually.

### 4. Verify Database is Active

- Make sure your Supabase project is not paused
- Check that the database is running in Supabase Dashboard
- Verify network access is allowed

### 5. Test Connection Locally

Before deploying, test the connection string locally:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Test connection
npx prisma db pull
```

If this works locally, the same URL should work in Vercel.

## Quick Fix Steps

1. ✅ Update `DATABASE_URL` in Vercel to use pooler URL (port 6543 or 5432 with pgbouncer=true)
2. ✅ Redeploy in Vercel (build should now succeed)
3. ✅ After successful deployment, run migrations manually:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

## Why This Happens

- Direct connection URLs (`db.*.supabase.co:5432`) may be blocked during Vercel builds
- Connection poolers are designed for serverless environments like Vercel
- Migrations during build can fail if database isn't accessible or firewall blocks connections


