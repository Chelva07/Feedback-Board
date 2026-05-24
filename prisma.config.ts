import type { PrismaConfig } from 'prisma'

export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:./dev.db',
  },
} satisfies PrismaConfig