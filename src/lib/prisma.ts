import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const url = process.env.TURSO_DATABASE_URL ?? 'file:./dev.db'
const authToken = process.env.TURSO_AUTH_TOKEN

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaLibSql({ url, authToken }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma