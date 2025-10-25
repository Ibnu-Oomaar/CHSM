import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  // return sessions for the user; superAdmin can list all
  if (user.role === 'superAdmin') {
    const all = await prisma.session.findMany({ orderBy: { createdAt: 'desc' } })
    return new Response(JSON.stringify({ sessions: all }), { status: 200 })
  }

  const sessions = await prisma.session.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
  return new Response(JSON.stringify({ sessions }), { status: 200 })
}
