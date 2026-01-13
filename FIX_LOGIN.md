# Fix Login Issue - Step by Step

## Problem
```
Can't reach database server at `db.hznyjskijavihatjhhni.supabase.co:5432`
```

This means you're using **direct connection URL** which doesn't work in Vercel.

## Solution: Change DATABASE_URL in Vercel

### Step 1: Get Connection Pooler URL from Supabase

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. **IMPORTANT**: Click on the dropdown and select **"Transaction"** (NOT "Direct connection")
6. You'll see a URL like this:
   ```
   postgresql://postgres.hznyjskijavihatjhhni:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
7. Copy this **entire URL** (including password)

### Step 2: Update in Vercel

1. Go to https://vercel.com
2. Select your project **daily-og**
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` in the list
5. Click **Edit** (or the pencil icon)
6. **Replace** the entire value with the pooler URL you copied
7. Make sure **Environment** is set to **Production** (and Preview/Development if you want)
8. Click **Save**

### Step 3: Verify the URL Format

Your `DATABASE_URL` should look like this:
```
postgresql://postgres.hznyjskijavihatjhhni:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Key differences:**
- ✅ Uses `pooler.supabase.com` (NOT `db.*.supabase.co`)
- ✅ Uses port `6543` (NOT `5432`)
- ✅ Has `aws-0-[REGION]` in the hostname

**Wrong format (what you have now):**
```
❌ postgresql://postgres:[PASSWORD]@db.hznyjskijavihatjhhni.supabase.co:5432/postgres
```

### Step 4: Redeploy

After updating `DATABASE_URL`:

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### Step 5: Verify Other Environment Variables

While you're in Vercel Environment Variables, check:

- ✅ `NEXTAUTH_URL` = `https://daily-og.vercel.app` (exact match, with https://)
- ✅ `NEXTAUTH_SECRET` = some long random string (32+ characters)
- ✅ `DATABASE_URL` = pooler URL (from step 1)

### Step 6: Test Login

1. Wait for redeploy to complete
2. Go to https://daily-og.vercel.app/auth/signin
3. Enter your email
4. Click Sign In
5. Should work now!

## If Still Not Working

### Check Vercel Function Logs

1. Vercel Dashboard → Your Project → **Functions** tab
2. Click on a function (like `/api/auth/[...nextauth]`)
3. Check **Logs** for errors
4. Look for database connection errors

### Verify Supabase Project is Active

1. Supabase Dashboard → Your Project
2. Check if project status is **Active** (not paused)
3. If paused, click **Resume**

### Run Database Migrations

If you haven't run migrations yet:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull env vars
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

Or use Supabase SQL Editor to run migration SQL manually.

## Quick Checklist

- [ ] `DATABASE_URL` in Vercel uses `pooler.supabase.com` (not `db.*.supabase.co`)
- [ ] `DATABASE_URL` uses port `6543` (not `5432`)
- [ ] `NEXTAUTH_URL` = `https://daily-og.vercel.app`
- [ ] `NEXTAUTH_SECRET` is set
- [ ] Redeployed after changing environment variables
- [ ] Supabase project is active (not paused)
- [ ] Database migrations have been run

## Common Mistakes

❌ **Using direct connection URL** (`db.*.supabase.co:5432`)
✅ **Use pooler URL** (`pooler.supabase.com:6543`)

❌ **Not redeploying after changing env vars**
✅ **Always redeploy after changing environment variables**

❌ **Wrong NEXTAUTH_URL** (missing https:// or wrong domain)
✅ **Exact match**: `https://daily-og.vercel.app`


