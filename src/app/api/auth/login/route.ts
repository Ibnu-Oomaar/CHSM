import prisma from '../../../../lib/prisma'
import { verifyPassword } from '../../../../lib/password'
import { createTokensForUser, saveRefreshToken } from '../../../../lib/auth'
import { makeRefreshCookie } from '../../../../lib/cookies'

export async function POST(req: Request) {
	const body = await req.json().catch(() => ({}))
	const { email, password, device } = body
	if (!email || !password) return new Response(JSON.stringify({ error: 'email and password required' }), { status: 400 })

	const user = await prisma.user.findUnique({ where: { email } })
	if (!user) return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 })

	const ok = await verifyPassword(user.password, password)
	if (!ok) return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 })

	const tokens = createTokensForUser({ id: user.id, role: user.role })
	const expires = new Date()
	expires.setDate(expires.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10))
	await saveRefreshToken({ userId: user.id, token: tokens.refreshToken, device: device || null, ip: null, expiresAt: expires })

		// create a session record
		try {
			const session = await prisma.session.create({ data: { userId: user.id, device: device || null, ip: null } })
			// include session id in response for client to manage
			const res = new Response(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken: tokens.accessToken, sessionId: session.id }), { status: 200 })
			res.headers.set('Set-Cookie', makeRefreshCookie(tokens.refreshToken))
			return res
		} catch (e) {
			// if session creation fails, fall back to previous behavior but still return tokens
			const res = new Response(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken: tokens.accessToken }), { status: 200 })
			res.headers.set('Set-Cookie', makeRefreshCookie(tokens.refreshToken))
			return res
		}
}
