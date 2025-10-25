import { PrismaClient } from '../generated/client'

// Create a single Prisma client instance (avoid multiple instances in dev hot reload)
declare global {
  // attach a cached Prisma client to the global object in development
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __prismaClient: PrismaClient | undefined
}

const prisma = globalThis.__prismaClient ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.__prismaClient = prisma

export default prisma
