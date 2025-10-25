import { revokeRefreshToken } from '../../../../lib/auth'
import { clearRefreshCookie } from '../../../../lib/cookies'

export async function POST(req: Request) {
  const cookieName = process.env.COOKIE_NAME || 'chs_refresh_token'
  const cookieHeader = req.headers.get('cookie') || ''
  const tokenFromCookie = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.split('=')[1]
  const body = await req.json().catch(() => ({}))
  const token = tokenFromCookie || body.refreshToken
  if (!token) return new Response(JSON.stringify({ ok: true }))

  await revokeRefreshToken(token)
  const res = new Response(JSON.stringify({ ok: true }), { status: 200 })
  // clear cookie
  res.headers.set('Set-Cookie', clearRefreshCookie())
  return res
}
