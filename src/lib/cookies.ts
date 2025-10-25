export function makeRefreshCookie(token: string) {
  const cookieName = process.env.COOKIE_NAME || 'chs_refresh_token'
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10)
  const maxAge = days * 24 * 60 * 60
  const secureFlag = process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''
  // HttpOnly and SameSite=Strict for safety
  return `${cookieName}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secureFlag}`
}

export function clearRefreshCookie() {
  const cookieName = process.env.COOKIE_NAME || 'chs_refresh_token'
  return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`
}
