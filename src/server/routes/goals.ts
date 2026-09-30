import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { NotFoundError } from '../errors.js'
import { findGoalById, listGoalsByOwner } from '../repositories/goal-repository.js'

const Goal = Type.Object({
  id: Type.String({ format: 'uuid' }),
  ownerId: Type.String({ format: 'uuid' }),
  title: Type.String(),
  progress: Type.Integer({ minimum: 0, maximum: 100 }),
  createdAt: Type.String({ format: 'date-time' })
})

export const goalRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/:id',
    {
      schema: {
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: { 200: Goal }
      }
    },
    async (request) => {
      const goal = await findGoalById(app.db, request.auth.companyId, request.params.id)
      if (!goal) throw new NotFoundError('Goal')
      return goal
    }
  )

  app.get(
    '/',
    {
      schema: {
        querystring: Type.Object({ ownerId: Type.String({ format: 'uuid' }) }),
        response: { 200: Type.Array(Goal) }
      }
    },
    async (request) => listGoalsByOwner(app.db, request.auth.companyId, request.query.ownerId)
  )
}
