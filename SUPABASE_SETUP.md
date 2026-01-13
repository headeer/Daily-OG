# Supabase Configuration Guide

## 1. Add Vercel Domain to Supabase

### Authentication Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel domain to **Site URL**:
   ```
   https://daily-og.vercel.app
   ```

5. Add to **Redirect URLs**:
   ```
   https://daily-og.vercel.app/**
   https://daily-og.vercel.app/api/auth/callback/*
   ```

6. Click **Save**

### Why This is Needed

Supabase needs to know which domains are allowed to make requests. Without this, authentication callbacks will fail.

## 2. Fix Database Connection URL

### Problem

The error shows you're using **direct connection URL**:
```
db.hznyjskijavihatjhhni.supabase.co:5432
```

This doesn't work in serverless environments like Vercel because:
- Direct connections may be blocked by firewall
- Connection pooling is required for serverless

### Solution: Use Connection Pooler URL

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string**
3. **IMPORTANT**: Select **"Transaction"** or **"Session"** mode (NOT "Direct connection")
4. Copy the **URI** format connection string

**Correct format (Transaction Pooler):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Or Session Pooler:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Update in Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Replace with the **pooler URL** (not direct connection)
4. Make sure it's set for **Production** environment
5. Click **Save**
6. **Redeploy** your application

## 3. Verify Configuration

After making changes:

1. ✅ **Supabase**: Site URL and Redirect URLs include `https://daily-og.vercel.app`
2. ✅ **Vercel**: `DATABASE_URL` uses pooler URL (port 6543 or 5432 with pgbouncer=true)
3. ✅ **Vercel**: `NEXTAUTH_URL` is set to `https://daily-og.vercel.app`
4. ✅ **Vercel**: `NEXTAUTH_SECRET` is set (32+ character random string)

## 4. Test

After updating:

1. Redeploy in Vercel (or push a new commit)
2. Try signing in at `https://daily-og.vercel.app/auth/signin`
3. Check Vercel function logs for any errors
4. Check Supabase logs if issues persist

## Troubleshooting

### Still getting "Can't reach database server"

- ✅ Verify `DATABASE_URL` uses pooler URL (check for `pooler.supabase.com` in URL)
- ✅ Check Supabase project is not paused
- ✅ Verify database is running in Supabase dashboard
- ✅ Check Vercel environment variables are set for "Production"

### Authentication still fails

- ✅ Verify Site URL in Supabase matches your Vercel domain exactly
- ✅ Check Redirect URLs include your callback URLs
- ✅ Verify `NEXTAUTH_URL` in Vercel matches your domain exactly
- ✅ Clear browser cookies and try again

### Connection works locally but not in Vercel

- Local development can use direct connection
- Vercel **MUST** use connection pooler
- Double-check Vercel environment variables are correct


