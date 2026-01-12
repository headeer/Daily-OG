# Daily Ops Planner

A local-first, cloud-synced daily planning system that enforces structured daily planning with 30-minute check-ins and produces real productivity statistics.

## Features

- **Daily Structure**: Define wake time, day length, and auto-generated 30-minute intervals
- **Top 3 Tasks**: Focus on your most important tasks each day
- **Time Block Planning**: Plan activities for each 30-minute block
- **Check-In System**: Track actual execution vs. planned activities
- **Statistics**: View daily, weekly, and monthly productivity metrics
- **Reminders**: 30-minute check-in notifications (while app is open)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- SQLite (local development)
- PostgreSQL (production)
- NextAuth.js (authentication)
- Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-me-in-production"
```

Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your Supabase credentials.

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables in Supabase
npx prisma migrate dev --name init
```

This will create all the necessary tables in your Supabase database.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed step-by-step instructions.

### Quick Start

1. **Set up Supabase**: Create a project and get your PostgreSQL connection string
2. **Push to GitHub**: Commit and push your code
3. **Deploy to Vercel**: Import repository and add environment variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `NEXTAUTH_URL`: Your Vercel deployment URL (set after first deploy)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
4. **Run Migrations**: After first deployment, run `npx prisma migrate deploy`

### Environment Variables

All required environment variables must be set in Vercel project settings:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

**Note**: Update `NEXTAUTH_URL` after first deployment with your actual Vercel URL.

## Project Structure

```
├── app/
│   ├── actions/          # Server actions
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── today/            # Today planning page
│   ├── checkin/          # Check-in page
│   ├── history/          # History/statistics page
│   └── settings/         # Settings page
├── components/           # React components
├── lib/                  # Utility functions
├── prisma/               # Prisma schema
└── types/                # TypeScript type definitions
```

## Usage

1. **Sign In**: Enter your email (no password required for MVP)
2. **Today Page**: Plan your day by setting wake time, day length, top 3 tasks, and time blocks
3. **Check-In Page**: Track what you're actually doing in real-time
4. **History Page**: View statistics and trends over time
5. **Settings Page**: Configure defaults and manage account

## Notes

- Reminders work while the app tab is open. True background notifications require push notification infrastructure.
- For production, consider adding password authentication or email magic links.
- Data export and account deletion features are stubbed and need full implementation.

## License

MIT

