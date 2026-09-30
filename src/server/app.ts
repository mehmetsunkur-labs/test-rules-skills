import Fastify, { type FastifyInstance } from 'fastify'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { Db } from './db.js'
import { errorHandler } from './errors.js'
import { authPlugin } from './plugins/auth.js'
import { goalRoutes } from './routes/goals.js'
import { legacyUserRoutes } from './routes/legacy/users.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Db
  }
}

export interface AppOptions {
  db: Db
  logger?: boolean
}

export async function buildApp({ db, logger = true }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger && { redact: ['req.headers.authorization', '*.email', '*.body'] }
  }).withTypeProvider<TypeBoxTypeProvider>()

  app.decorate('db', db)
  app.setErrorHandler(errorHandler)
  await app.register(authPlugin)
  await app.register(goalRoutes, { prefix: '/goals' })
  await app.register(legacyUserRoutes, { prefix: '/users' })
  return app
}
