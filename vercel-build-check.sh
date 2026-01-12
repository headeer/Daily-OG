#!/bin/bash
# Pre-deployment build check script
# Run this locally to verify everything builds correctly

echo "🔍 Running pre-deployment checks..."

# Check if DATABASE_URL is set (for local testing)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Using test value..."
  export DATABASE_URL="postgresql://test:test@localhost:5432/test"
fi

# Check if NEXTAUTH_SECRET is set
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "⚠️  NEXTAUTH_SECRET not set. Generating test value..."
  export NEXTAUTH_SECRET="test-secret-for-build-check-only"
fi

# Check if NEXTAUTH_URL is set
if [ -z "$NEXTAUTH_URL" ]; then
  echo "⚠️  NEXTAUTH_URL not set. Using default..."
  export NEXTAUTH_URL="http://localhost:3000"
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful! Ready for deployment."
else
  echo "❌ Build failed. Check errors above."
  exit 1
fi

