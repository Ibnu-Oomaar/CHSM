// src/app/api/hospitals/auth/registerUser/route.ts
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { createTokensForUser, saveRefreshToken } from '@/lib/auth'
import { requireAuth } from '@/lib/middleware'

// -------------------- POST register HospitalUser --------------------
export async function POST(req: Request) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  // Only hospital admin can register users
  const isAdmin = await prisma.hospitalUser.findFirst({
    where: { id: current.id, role: 'admin' },
    include: { hospital: true },
  })
  if (!isAdmin) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { name, email, phone, password, role } = body
  if (!name || !email || !password || !role)
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })

  const allowedRoles = ['admin', 'doctor', 'nurse', 'patient', 'pharmacist']
  if (!allowedRoles.includes(role))
    return new Response(JSON.stringify({ error: 'Invalid role for hospital user' }), { status: 400 })

  const exists = await prisma.hospitalUser.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) return new Response(JSON.stringify({ error: 'email already exists' }), { status: 409 })

  const hashed = await hashPassword(password)
  const hospitalUser = await prisma.hospitalUser.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: hashed,
      role,
      hospitalId: isAdmin.hospitalId,
      hospitalName: isAdmin.hospitalId
    },
  })

  const tokens = createTokensForUser({ id: hospitalUser.id, role: hospitalUser.role })
  const expires = new Date()
  expires.setDate(expires.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10))
  await saveRefreshToken({ userId: hospitalUser.id, token: tokens.refreshToken, device: null, ip: null, expiresAt: expires })

  const res = new Response(
    JSON.stringify({
      user: {
        id: hospitalUser.id,
        name: hospitalUser.name,
        email: hospitalUser.email,
        role: hospitalUser.role,
        hospitalId: hospitalUser.hospitalId,
        hospitalName: hospitalUser.hospitalName,
      },
      accessToken: tokens.accessToken,
    }),
    { status: 201 }
  )
  res.headers.set(
    'Set-Cookie',
    `${process.env.COOKIE_NAME || 'chs_refresh_token'}=${tokens.refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Strict`
  )
  return res
}

// -------------------- GET all HospitalUsers for admin's hospital --------------------
export async function GET(req: Request) {
  const current = await requireAuth(req)
  if (!current) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const isAdmin = await prisma.hospitalUser.findFirst({
    where: { id: current.id, role: 'admin' },
  })
  if (!isAdmin) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const users = await prisma.hospitalUser.findMany({
    where: { hospitalId: isAdmin.hospitalId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  })
  return new Response(JSON.stringify({ users }), { status: 200 })
}
