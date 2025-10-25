import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  if (current.role !== 'superAdmin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const id = params.id
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  if (body.name) data.name = body.name
  if (body.desc) data.desc = body.desc
  const updated = await prisma.permission.update({ where: { id }, data })
  return new Response(JSON.stringify({ permission: updated }), { status: 200 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  if (current.role !== 'superAdmin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const id = params.id
  await prisma.permission.delete({ where: { id } })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
