#!/bin/bash
# Script to run Prisma migrations on production database
# 
# Usage:
#   1. First, pull production env vars: vercel env pull .env.production
#   2. Then run this script: ./migrate-production.sh

set -e

echo "🔄 Running Prisma migrations on production database..."

if [ ! -f .env.production ]; then
  echo "❌ .env.production not found!"
  echo "Run: vercel env pull .env.production"
  exit 1
fi

# Extract DATABASE_URL from .env.production
# Try POSTGRES_PRISMA_URL first (Vercel default), then DATABASE_URL
if grep -q "POSTGRES_PRISMA_URL" .env.production; then
  export $(grep POSTGRES_PRISMA_URL .env.production | xargs)
  export DATABASE_URL=$POSTGRES_PRISMA_URL
elif grep -q "DATABASE_URL" .env.production; then
  export $(grep DATABASE_URL .env.production | xargs)
else
  echo "❌ No DATABASE_URL or POSTGRES_PRISMA_URL found in .env.production"
  exit 1
fi

echo "✅ Found database URL"
echo "📊 Checking migration status..."

npx prisma migrate status

echo ""
echo "🚀 Deploying migrations..."
npx prisma migrate deploy

echo ""
echo "✨ Migrations complete!"
echo "🎯 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ All done! Your production database is up to date."
