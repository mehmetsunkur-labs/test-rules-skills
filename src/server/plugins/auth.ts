import fp from 'fastify-plugin'
import { AppError } from '../errors.js'

export interface AuthContext {
  userId: string
  companyId: string
  role: 'employee' | 'manager' | 'admin'
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext
  }
}

// Stub: in production this verifies the session JWT issued by the identity service.
async function verifyToken(token: string): Promise<AuthContext | undefined> {
  const [userId, companyId, role] = token.split(':')
  if (!userId || !companyId || (role !== 'employee' && role !== 'manager' && role !== 'admin')) return undefined
  return { userId, companyId, role }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest('auth')
  app.addHook('onRequest', async (request) => {
    const token = request.headers.authorization?.replace(/^Bearer /, '')
    const auth = token ? await verifyToken(token) : undefined
    if (!auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED')
    request.auth = auth
  })
})
