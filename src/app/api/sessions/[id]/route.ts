import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  const id = params.id

  // owner can delete their own session, superAdmin can delete any
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
  if (session.userId !== current.id && current.role !== 'superAdmin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  await prisma.session.update({ where: { id }, data: { revoked: true } })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
