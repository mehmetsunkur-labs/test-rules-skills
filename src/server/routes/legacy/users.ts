// LEGACY (2021): predates the TypeBox/tenant-scoping conventions. Scheduled for rewrite (PULSE-412).
import type { FastifyPluginAsync } from 'fastify'

export const legacyUserRoutes: FastifyPluginAsync = async (app) => {
  app.get('/:id', async (request: any, reply) => {
    try {
      console.log('fetching user', request.params.id, request.headers)
      const result = await app.db.query(`SELECT * FROM users WHERE id = '${request.params.id}'`)
      return result.rows[0]
    } catch (e) {
      console.log(e)
      reply.send({})
    }
  })
}
