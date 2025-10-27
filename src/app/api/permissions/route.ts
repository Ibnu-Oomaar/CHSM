import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(req: Request) {
  // public read allowed for authenticated users
  const user = await requireAuth(req)
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  const perms = await prisma.permission.findMany({ orderBy: { name: 'asc' } })
  return new Response(JSON.stringify({ permissions: perms }), { status: 200 })
}

export async function POST(req: Request) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  // only superAdmin can create permissions
  if (current.role !== 'superAdmin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { name, desc } = body
  if (!name) return new Response(JSON.stringify({ error: 'name required' }), { status: 400 })
  const exists = await prisma.permission.findUnique({ where: { name } })
  if (exists) return new Response(JSON.stringify({ error: 'this permission already taken' }), { status: 409 })
  const created = await prisma.permission.create({ data: { name, desc: desc || '' } })
  return new Response(JSON.stringify({ permission: created }), { status: 201 })
}
