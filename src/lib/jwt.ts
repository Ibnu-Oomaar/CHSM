import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change-this-access-secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret'
const ACCESS_MIN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_MIN || '15', 10)
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10)

export function signAccessToken(payload: object) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: `${ACCESS_MIN}m` })
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: `${REFRESH_DAYS}d` })
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, ACCESS_SECRET) as object
  } catch (e) {
    return null
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET) as object
  } catch (e) {
    return null
  }
}
