import { verifyRefreshToken, signAccessToken } from '../../../../lib/jwt'
import { findRefreshTokenRecordByToken, rotateRefreshToken } from '../../../../lib/auth'
import { makeRefreshCookie } from '../../../../lib/cookies'

export async function POST(req: Request) {
	// try cookie first
	const cookieName = process.env.COOKIE_NAME || 'chs_refresh_token'
	const cookieHeader = req.headers.get('cookie') || ''
	const tokenFromCookie = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.split('=')[1]
	const body = await req.json().catch(() => ({}))
	const token = tokenFromCookie || body.refreshToken
	if (!token) return new Response(JSON.stringify({ error: 'refresh token required' }), { status: 400 })

		const verified = verifyRefreshToken(token)
	if (!verified) return new Response(JSON.stringify({ error: 'invalid refresh token' }), { status: 401 })

	// check DB record
	const rec = await findRefreshTokenRecordByToken(token)
	if (!rec || rec.revoked || new Date(rec.expiresAt) < new Date()) return new Response(JSON.stringify({ error: 'refresh token revoked or expired' }), { status: 401 })

	const userId = String((verified as any).sub)
		const { newToken } = await rotateRefreshToken(token, userId, null, null)

		const res = new Response(JSON.stringify({ accessToken: signAccessToken({ sub: userId }) }), { status: 200 })
		res.headers.set('Set-Cookie', makeRefreshCookie(newToken))
		return res
}
