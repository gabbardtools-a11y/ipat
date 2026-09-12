// Database client stub.
//
// Изначально тут был PrismaClient, но мы не используем БД —
// все 117 патентов хранятся как статичные данные в `./patents-data.ts`.
//
// Когда понадобится настоящая БД (например, для заявок из формы),
// поставь Prisma обратно:
//   npm install @prisma/client prisma && npx prisma generate
// и замени этот файл на:
//   import { PrismaClient } from '@prisma/client'
//   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
//   export const db = globalForPrisma.prisma ?? new PrismaClient()
//   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export const db = null;
