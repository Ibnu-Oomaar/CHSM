import { createServer } from 'http'
import { Server } from 'socket.io'
import { verifyAccessToken } from '../lib/jwt'

const httpServer = createServer()

const io = new Server(httpServer, { cors: { origin: '*' } })

io.use((socket, next) => {
  // token can be sent in query as token
  const token = (socket.handshake.query && socket.handshake.query.token) as string | undefined
  if (!token) return next(new Error('unauthorized'))
  const payload = verifyAccessToken(token)
  if (!payload) return next(new Error('invalid token'))
  ;(socket as any).user = { id: (payload as any).sub }
  next()
})

io.on('connection', (socket) => {
  const user = (socket as any).user
  console.log('user connected', user?.id)
  socket.join(user.id)

  socket.on('ping', (cb) => cb && cb('pong'))
  socket.on('disconnect', () => {
    console.log('user disconnected', user?.id)
  })
})

const PORT = parseInt(process.env.SOCKET_PORT || '4000', 10)
httpServer.listen(PORT, () => console.log(`Socket.IO server running on port ${PORT}`))

// Export for programmatic use
export { io, httpServer }
