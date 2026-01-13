# Debug Login Issues - Checklist

## ✅ DATABASE_URL is Correct

If your `DATABASE_URL` uses pooler URL (`pooler.supabase.com:6543`), check these:

## 1. Check Database Migrations

**Problem**: Tables might not exist in database.

### Check in Supabase:
1. Supabase Dashboard → **Table Editor**
2. You should see these tables:
   - ✅ `User`
   - ✅ `DayEntry`
   - ✅ `TimeBlock`

### If tables don't exist, run migrations:

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.production
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
1. Supabase Dashboard → **SQL Editor**
2. Find migration file: `prisma/migrations/[timestamp]_init/migration.sql`
3. Copy SQL and run in SQL Editor

## 2. Check Environment Variables in Vercel

Go to Vercel → Settings → Environment Variables and verify:

### Required Variables:

- ✅ `DATABASE_URL` = pooler URL (you confirmed this is correct)
- ✅ `NEXTAUTH_URL` = `https://daily-og.vercel.app` (exact match, with https://)
- ✅ `NEXTAUTH_SECRET` = long random string (32+ characters)

### Common Issues:

❌ `NEXTAUTH_URL` missing or wrong
- Should be: `https://daily-og.vercel.app`
- NOT: `http://daily-og.vercel.app` (missing s)
- NOT: `daily-og.vercel.app` (missing https://)

❌ `NEXTAUTH_SECRET` missing or too short
- Should be 32+ characters
- Generate with: `openssl rand -base64 32`

## 3. Check Supabase Authentication Settings

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://daily-og.vercel.app`
3. **Redirect URLs**: Should include:
   ```
   https://daily-og.vercel.app/**
   https://daily-og.vercel.app/api/auth/callback/*
   ```

## 4. Redeploy After Changing Environment Variables

**IMPORTANT**: After changing any environment variable in Vercel:
1. Go to **Deployments** tab
2. Click **three dots** (⋯) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

Environment variables are only loaded during build/deploy, so changes require redeploy!

## 5. Check Vercel Function Logs

1. Vercel Dashboard → Your Project → **Functions** tab
2. Click on `/api/auth/[...nextauth]`
3. Check **Logs** tab
4. Look for errors when you try to sign in

Common errors in logs:
- Database connection errors
- Missing environment variables
- Authentication errors

## 6. Test Database Connection

You can test if database connection works:

```bash
# Pull env vars from Vercel
vercel env pull .env.production

# Test connection
npx prisma db pull
```

If this works, database connection is fine.

## 7. Clear Browser Data

Sometimes browser cache/cookies cause issues:
1. Clear cookies for `daily-og.vercel.app`
2. Try incognito/private window
3. Try different browser

## Quick Diagnostic Steps

Run these checks in order:

1. ✅ `DATABASE_URL` uses pooler URL (you confirmed)
2. [ ] Tables exist in Supabase (check Table Editor)
3. [ ] `NEXTAUTH_URL` = `https://daily-og.vercel.app` in Vercel
4. [ ] `NEXTAUTH_SECRET` is set in Vercel
5. [ ] Supabase Site URL includes your domain
6. [ ] Redeployed after changing env vars
7. [ ] Check Vercel function logs for errors

## Still Not Working?

If all above is correct but still failing:

1. **Check Vercel Function Logs** - most important!
   - Look for exact error message
   - Check timestamp when you tried to login

2. **Verify Supabase Project Status**
   - Make sure project is **Active** (not paused)
   - Check if database is running

3. **Test with Vercel CLI locally**
   ```bash
   vercel env pull .env.production
   npm run build
   ```
   If build works, issue is in Vercel deployment

4. **Check Network Tab in Browser**
   - Open DevTools → Network
   - Try to sign in
   - Check `/api/auth/callback/credentials` request
   - Look at response status and error message


