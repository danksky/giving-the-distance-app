import { PrismaClient } from '@prisma/client'

// Allow local dev to use DATABASE_URL (common) or POSTGRES_URL as fallback.
// Prisma resolves `env("POSTGRES_PRISMA_URL")` / `env("POSTGRES_URL_NON_POOLING")`
// at runtime when the client first queries.
if (!process.env.POSTGRES_PRISMA_URL) {
  const fallback =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim()
  if (fallback) process.env.POSTGRES_PRISMA_URL = fallback
}

if (!process.env.POSTGRES_URL_NON_POOLING) {
  const fallback =
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()
  if (fallback) process.env.POSTGRES_URL_NON_POOLING = fallback
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

