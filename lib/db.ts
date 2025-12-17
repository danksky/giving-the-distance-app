import { PrismaClient } from '@prisma/client'

// Normalize Vercel's multiple Postgres env vars to standard DATABASE_URL / DIRECT_URL.
// This way we use standard names everywhere instead of Vercel's confusing duplicates.
if (!process.env.DATABASE_URL) {
  const url = 
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()
  if (url) process.env.DATABASE_URL = url
}

if (!process.env.DIRECT_URL) {
  const directUrl = 
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DATABASE_URL?.trim()
  if (directUrl) process.env.DIRECT_URL = directUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
