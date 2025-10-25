import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware'
import { hashPassword } from '@/lib/password'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  // only allow users with roles or superAdmin to list users
  if (!requireRole(user, ['superAdmin', 'government'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true } })
  return new Response(JSON.stringify({ users }), { status: 200 })
}

// export async function POST(req: Request) {
//   const current = await requireAuth(req)
//   if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
//   // only superAdmin can create arbitrary users
//   if (!requireRole(current, ['superAdmin'])) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

//   const body = await req.json().catch(() => ({}))
//   const { name, email, phone, password, role } = body
//   if (!name || !email || !password) return new Response(JSON.stringify({ error: 'name,email,password required' }), { status: 400 })

//   const exists = await prisma.user.findUnique({ where: { email } })
//   if (exists) return new Response(JSON.stringify({ error: 'email exists' }), { status: 409 })

//   const hashed = await hashPassword(password)
//   const created = await prisma.user.create({ data: { name, email, phone: phone || '', password: hashed, role: role || 'hospital' } })
//   return new Response(JSON.stringify({ user: { id: created.id, name: created.name, email: created.email, role: created.role } }), { status: 201 })
// }
