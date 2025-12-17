# Giving the Distance - Production App

> Modern Next.js application combining frontend and backend services

## 🎯 Overview

This is the **production version** of Giving the Distance, built with Next.js 16 and deployed on Vercel.

### What is Giving the Distance?

A platform connecting athletes, businesses, and causes through every mile. Users connect their Strava accounts and create sponsorships where sponsors pay per mile/kilometer run.

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres + Prisma ORM
- **Auth**: NextAuth.js (Google OAuth + Strava)
- **Payments**: Stripe
- **Hosting**: Vercel
- **Integrations**: Strava API

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
app/
├── (public)/          # Public pages (landing, about)
├── (auth)/            # Auth pages (signin, signup, callbacks)
├── (dashboard)/       # Protected app pages
└── api/               # API routes (backend logic)
    ├── auth/          # Authentication endpoints
    ├── user/          # User management
    ├── strava/        # Strava integration & webhooks
    ├── sponsorship/   # Sponsorship logic
    └── stripe/        # Payment processing & webhooks

lib/
├── auth/              # Auth utilities
├── db/                # Database client & queries
├── strava/            # Strava API client
└── stripe/            # Stripe utilities

prisma/
└── schema.prisma      # Database schema
```

## 🔐 Environment Variables

See `.env.example` for required environment variables.

Key variables:

- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `STRAVA_CLIENT_ID` & `STRAVA_CLIENT_SECRET` - Strava integration
- `STRIPE_SECRET_KEY` - Payment processing
- `NEXTAUTH_SECRET` - Session encryption
- `DATABASE_URL` - Database connection

## 🌐 Domains

- **Production**: https://givingthedistance.org
- **Preview**: https://beta.givingthedistance.org

## 📖 Documentation

- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Full migration plan from old architecture
- [Old React App](../giving-the-distance-react) - Reference for UI/UX
- [Old Express API](../giving-the-distance-express) - Reference for business logic

## 🔄 Migration Status

This app is currently under development, migrating from a React + Express + AWS stack.

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for detailed progress and next steps.

## 🧪 Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 📦 Key Dependencies

- `next` - React framework
- `next-auth` - Authentication
- `@prisma/client` - Database ORM
- `stripe` - Payment processing
- (More to be added as we build)

## 🤝 Related Projects

- `giving-the-distance-fake-door` - Current landing page on Vercel
- `giving-the-distance-react` - Old frontend (React CRA)
- `giving-the-distance-express` - Old backend (Express + EC2)

---

**Note**: This project replaces the separate React + Express architecture with a unified Next.js application.
