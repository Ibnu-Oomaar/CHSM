Auth & Security README

Files added:
- `.env.example` - environment variables for JWT secrets and token lifetimes.
- `src/lib/password.ts` - argon2 helpers.
- `src/lib/jwt.ts` - sign/verify access and refresh tokens.
- `src/lib/auth.ts` - helpers to create tokens, save/rotate/revoke refresh tokens in DB.
- `src/lib/prisma.ts` - Prisma client singleton helper.
- `src/lib/middleware.ts` - simple requireAuth/requireRole helpers.
- `src/app/api/auth/*` - register, login, refresh, logout routes.
- `src/app/api/users/*` - users CRUD routes (POST, GET all, GET by id, PUT, DELETE).
- `src/socket/socketServer.ts` - small Socket.IO server to authenticate sockets with access token.

Environment
1. Copy `.env.example` to `.env` and set secure secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
2. Set `DATABASE_URL` to your database and run Prisma migrations.

Tokens
- Access token lifetime: `ACCESS_TOKEN_EXPIRES_MIN` (default 15 minutes).
- Refresh token lifetime: `REFRESH_TOKEN_EXPIRES_DAYS` (default 7 days).
- Refresh tokens are stored hashed in the `RefreshToken` Prisma model.

Running
1. Install dependencies: `npm install`.
2. Run Next.js app as usual: `npm run dev`.
3. Optionally run the Socket.IO server separately: `node ./src/socket/socketServer.ts` (or use ts-node).

Notes
- SuperAdmin: operations protected by role checks. By default creating a `superAdmin` via the open register endpoint is blocked unless you set `ALLOW_SUPERADMIN_CREATION=1` in env.
- Cookies: refresh tokens are sent as httpOnly cookies. Adjust cookie options in production (Secure, SameSite, domain).

Security considerations
- Access tokens are short-lived (15m) and used for authorization. Refresh tokens are rotated on use.
- Passwords are hashed with Argon2.
- Socket connections should provide an access token (in query or header) to authenticate.
