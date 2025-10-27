import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware'
import { hashPassword } from '@/lib/password'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req)
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const id = params.id
  // allow superAdmin or the user themself to read
  if (!requireRole(user, ['superAdmin']) && user.id !== id) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true } })
  if (!u) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
  return new Response(JSON.stringify({ user: u }), { status: 200 })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  const id = params.id
  const body = await req.json().catch(() => ({}))
  // only superAdmin or owner can update
  if (!requireRole(current, ['superAdmin']) && current.id !== id) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const data: any = {}
  if (body.name) data.name = body.name
  if (body.email) data.email = body.email.toLowerCase()
  if (body.phone) data.phone = body.phone
  if (body.password) data.password = await hashPassword(body.password)
  if (body.role && requireRole(current, ['superAdmin'])) data.role = body.role

  const updated = await prisma.user.update({ where: { id }, data })
  return new Response(JSON.stringify({ user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } }), { status: 200 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  const id = params.id
  // only superAdmin can delete
  if (!requireRole(current, ['superAdmin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  await prisma.user.delete({ where: { id } })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
