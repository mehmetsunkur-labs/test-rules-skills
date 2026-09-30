import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply): FastifyReply {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ code: error.code, message: error.message })
  }
  if (error.validation) {
    return reply.status(400).send({ code: 'VALIDATION_ERROR', message: error.message })
  }
  request.log.error({ err: error }, 'unhandled error')
  return reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Internal server error' })
}
