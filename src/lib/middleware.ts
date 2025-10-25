import { verifyAccessToken } from './jwt'
import prisma from './prisma'

export async function requireAuth(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const payload = verifyAccessToken(token)
  if (!payload) return null
  const userId = (payload as any).sub
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: String(userId) } })
  if (!user) return null
  return user
}

export function requireRole(user: any, roles: string[] = []) {
  if (!user) return false
  if (!roles || roles.length === 0) return true
  return roles.includes(user.role as string) || user.role === 'superAdmin'
}
