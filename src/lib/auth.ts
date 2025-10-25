import prisma from './prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt'
import { hashPassword, verifyPassword } from './password'

// Basic contract:
// - createTokensForUser(user) -> { accessToken, refreshToken }
// - saveRefreshToken(hashedToken, userId, device, ip, expiresAt)
// - authenticate from request (access token Bearer)

export function createTokensForUser(user: { id: string; role?: string }) {
	const payload = { sub: user.id, role: user.role }
	const accessToken = signAccessToken(payload)
	const refreshToken = signRefreshToken(payload)
	return { accessToken, refreshToken }
}

export async function saveRefreshToken(params: {
	userId: string
	token: string
	device?: string | null
	ip?: string | null
	expiresAt: Date
}) {
	// store hashed token in DB
	const hashed = await hashPassword(params.token)
	return prisma.refreshToken.create({
		data: {
			userId: params.userId,
			hashedToken: hashed,
			device: params.device,
			ip: params.ip,
			expiresAt: params.expiresAt,
		},
	})
}

export async function revokeRefreshTokenById(id: string, replacedBy?: string) {
	return prisma.refreshToken.update({ where: { id }, data: { revoked: true, replacedBy } })
}

export async function revokeRefreshToken(token: string) {
	// find any matching hashed token and revoke (argon2 verify)
	const toks = await prisma.refreshToken.findMany({ where: { revoked: false } })
	for (const t of toks) {
		try {
			const ok = await verifyPassword(t.hashedToken, token)
			if (ok) {
				await prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } })
				return true
			}
		} catch (e) {
			continue
		}
	}
	return false
}

export async function rotateRefreshToken(oldToken: string, userId: string, device?: string | null, ip?: string | null) {
	// revoke old and issue new
	const old = await prisma.refreshToken.findFirst({ where: { revoked: false }, orderBy: { createdAt: 'desc' } })
	// Always issue new token
	const payload = { sub: userId }
	const newToken = signRefreshToken(payload)
	const expires = new Date()
	expires.setDate(expires.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10))
	// save new hashed
	const created = await saveRefreshToken({ userId, token: newToken, device, ip, expiresAt: expires })
	if (old) {
		await revokeRefreshTokenById(old.id, created.id)
	}
	return { newToken, created }
}

export async function findRefreshTokenRecordByToken(token: string) {
	const rows = await prisma.refreshToken.findMany({ where: {} })
	for (const r of rows) {
		try {
			const ok = await verifyPassword(r.hashedToken, token)
			if (ok) return r
		} catch (e) {
			continue
		}
	}
	return null
}

export function verifyRefresh(token: string) {
	return verifyRefreshToken(token)
}
