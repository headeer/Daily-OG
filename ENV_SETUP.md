# Environment Variables Setup Guide

## Quick Setup for Vercel

### 1. Get Supabase Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string**
5. **IMPORTANT**: Select **"Transaction"** or **"Session"** mode (NOT "Direct connection")
6. Copy the **URI** format connection string

**Correct format (Transaction Pooler):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Or Session Pooler:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
```

### 2. Generate NEXTAUTH_SECRET

**Option A: Using OpenSSL (Terminal)**
```bash
openssl rand -base64 32
```

**Option B: Online Generator**
Visit: https://generate-secret.vercel.app/32

**Option C: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Set NEXTAUTH_URL

After your first deployment to Vercel:
1. Get your deployment URL (e.g., `https://your-app-name.vercel.app`)
2. Update `NEXTAUTH_URL` in Vercel environment variables

### 4. Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - `DATABASE_URL` (from step 1)
   - `NEXTAUTH_URL` (from step 3, or use placeholder for first deploy)
   - `NEXTAUTH_SECRET` (from step 2)
   - `NODE_ENV` = `production` (optional)

4. **IMPORTANT**: Make sure to select **"Production"** environment for all variables
5. Click **Save**

### 5. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Environment Variables Checklist

- [ ] `DATABASE_URL` - Supabase connection pooler URL (NOT direct connection)
- [ ] `NEXTAUTH_URL` - Your Vercel deployment URL
- [ ] `NEXTAUTH_SECRET` - Secure random 32+ character string
- [ ] `NODE_ENV` - Set to `production` (optional)

## Common Mistakes

❌ **Using direct connection URL** (`db.*.supabase.co:5432`)
✅ **Use connection pooler URL** (`pooler.supabase.com:6543`)

❌ **Short or predictable NEXTAUTH_SECRET**
✅ **Use 32+ character random string**

❌ **Wrong NEXTAUTH_URL** (localhost or missing https://)
✅ **Use full Vercel URL with https://**

## Testing Locally

To test with production environment variables locally:

```bash
# Pull environment variables from Vercel
vercel env pull .env.production

# Or manually copy from Vercel dashboard to .env.production
```

Then run:
```bash
npm run build
```

## Verification

After deployment, verify:
1. ✅ App loads without errors
2. ✅ Sign-in page works
3. ✅ Can create account/login
4. ✅ Data persists (create a day entry and refresh)
5. ✅ Check Vercel logs for any errors

## Troubleshooting

### "Can't reach database server"
- Check `DATABASE_URL` uses pooler URL (port 6543 or 5432 with pgbouncer=true)
- Verify Supabase project is active (not paused)
- Check Supabase dashboard → Database → Connection pooling is enabled

### "Invalid credentials" or auth errors
- Verify `NEXTAUTH_SECRET` is set correctly
- Check `NEXTAUTH_URL` matches your deployment URL exactly
- Clear browser cookies and try again

### Build succeeds but app doesn't work
- Check Vercel function logs
- Verify all environment variables are set for "Production" environment
- Check browser console for client-side errors

