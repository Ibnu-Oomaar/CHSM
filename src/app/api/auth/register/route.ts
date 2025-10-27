import prisma from '../../../../lib/prisma'
import { hashPassword } from '../../../../lib/password'
import { createTokensForUser, saveRefreshToken } from '../../../../lib/auth'
import { requireAuth, requireRole } from '../../../../lib/middleware'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, email, phone, password, role } = body
  if (!name || !email || !password) {
    return new Response(JSON.stringify({ error: 'The register user something was missing' }), { status: 400 })
  }

  // Prevent open creation of superAdmin unless explicit env enables it
  if (role === 'superAdmin' && !process.env.ALLOW_SUPERADMIN_CREATION) {
    return new Response(JSON.stringify({ error: 'creating superAdmin is disabled' }), { status: 403 })
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) return new Response(JSON.stringify({ error: 'email already exists' }), { status: 409 })

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({ data: { name, email, phone: phone || '', password: hashed, role: role || 'hospital' } })

  const tokens = createTokensForUser({ id: user.id, role: user.role })
  // store refresh token hashed
  const expires = new Date()
  expires.setDate(expires.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10))
  await saveRefreshToken({ userId: user.id, token: tokens.refreshToken, device: null, ip: null, expiresAt: expires })

  // don't return password
  // set cookie for refresh token (httpOnly cookie recommended but in app router this is example)
  const res = new Response(JSON.stringify({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken: tokens.accessToken }), { status: 201 })
  // set refresh token cookie (note: when deploying, set HttpOnly, secure, sameSite)
  res.headers.set('Set-Cookie', `${process.env.COOKIE_NAME || 'chs_refresh_token'}=${tokens.refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Strict`) 
  return res
}

// GET: return all users (protected: superAdmin or government)
export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  if (!requireRole(user, ['superAdmin', 'government'])) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true } })
  return new Response(JSON.stringify({ users }), { status: 200 })
}
