#!/bin/bash

# Charity Selection Setup Script
echo "🌍 Setting up charity selection feature..."
echo ""

# Step 1: Install tsx if needed
echo "📦 Installing dependencies..."
npm install --save-dev tsx
echo ""

# Step 2: Create migration
echo "🗄️  Creating database migration..."
npx prisma migrate dev --name add_charity_selection
echo ""

# Step 3: Seed charities
echo "🌱 Seeding charities..."
npm run db:seed
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Visit http://localhost:3000/settings/charity to test"
echo "3. Run 'npm run db:studio' to view the data"
