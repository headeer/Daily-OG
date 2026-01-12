# Deployment Guide - Daily Ops Planner

## Pre-Deployment Checklist

- [ ] Supabase project created and database ready
- [ ] Environment variables prepared (see `.env.production.example`)
- [ ] GitHub repository created
- [ ] Code committed and pushed to GitHub
- [ ] Local build test passed (run `npm run build` locally)
- [ ] Prisma schema uses `postgresql` provider (already configured)

## Step-by-Step Deployment

### 1. Prepare Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a project
2. Wait for the database to be provisioned
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Or direct: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 2. Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Vercel deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/daily-ops-planner.git

# Push to main branch
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### 4. Add Environment Variables in Vercel

In your Vercel project settings, go to **Settings** → **Environment Variables** and add:

#### Required Variables:

**IMPORTANT**: Use the **Connection Pooling** URL, not the direct connection URL.

```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Or use the transaction pooler:
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**DO NOT use** the direct connection URL (`db.[PROJECT].supabase.co:5432`) as it may not work during build.

```
NEXTAUTH_URL=https://your-app-name.vercel.app
```
*(Replace with your actual Vercel URL after first deployment)*

```
NEXTAUTH_SECRET=your-super-secret-random-string-here-min-32-chars
```
*(Generate with: `openssl rand -base64 32`)*

#### Optional Variables:

```
NODE_ENV=production
```

### 5. Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build to complete
3. Check build logs for any errors

### 6. Run Database Migrations

**IMPORTANT**: Migrations should NOT run during build. Run them manually after first deployment.

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Find your latest migration in `prisma/migrations/[timestamp]_init/migration.sql`
3. Copy and paste the SQL into the editor
4. Run the query

**Quick Check**: After running migrations, verify in Supabase Dashboard → Table Editor that you see:
- `User` table
- `DayEntry` table  
- `TimeBlock` table

### 7. Verify Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test sign-in functionality
3. Verify database connection works
4. Test creating a day entry

## Post-Deployment

### Update NEXTAUTH_URL

After first deployment, update `NEXTAUTH_URL` in Vercel environment variables with your actual deployment URL.

### Generate NEXTAUTH_SECRET

Use a secure random string:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Troubleshooting

### Build Fails

- Check that `DATABASE_URL` is set correctly
- Verify Prisma schema uses `postgresql` provider
- Check build logs in Vercel dashboard

### Database Connection Errors

- Verify `DATABASE_URL` format is correct
- Check Supabase project is active
- Ensure database is not paused

### Authentication Not Working

- Verify `NEXTAUTH_URL` matches your deployment URL exactly
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

### Migrations Not Running

- Run `npx prisma migrate deploy` manually
- Check Prisma logs in build output
- Verify database permissions

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres...` |
| `NEXTAUTH_URL` | Your Vercel deployment URL | `https://app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret key for JWT signing | Random 32+ character string |

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations run successfully
- [ ] Sign-in functionality works
- [ ] Data persists correctly
- [ ] Notifications work (when tab is open)
- [ ] All pages load correctly
- [ ] Mobile responsive design works

## Support

For issues, check:
- Vercel build logs
- Supabase database logs
- Browser console for client errors
- Network tab for API errors

