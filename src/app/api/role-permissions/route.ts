import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function POST(req: Request) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  if (current.role !== 'superAdmin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { role, permissionId } = body
  if (!role || !permissionId) return new Response(JSON.stringify({ error: 'role and permissionId required' }), { status: 400 })

  const exists = await prisma.rolePermission.findFirst({ where: { role: role as any, permissionId } })
  if (exists) return new Response(JSON.stringify({ error: 'already assigned' }), { status: 409 })
  const created = await prisma.rolePermission.create({ data: { role: role as any, permissionId } })
  return new Response(JSON.stringify({ rolePermission: created }), { status: 201 })
}

export async function DELETE(req: Request) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  if (current.role !== 'superAdmin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { role, permissionId } = body
  if (!role || !permissionId) return new Response(JSON.stringify({ error: 'role and permissionId required' }), { status: 400 })

  await prisma.rolePermission.deleteMany({ where: { role: role as any, permissionId } })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
