import { describe, expect, it } from 'vitest'
import { buildApp } from '../app.js'
import type { Db } from '../db.js'

const COMPANY_A = '11111111-1111-4111-8111-111111111111'
const COMPANY_B = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const GOAL_ID = '44444444-4444-4444-8444-444444444444'

function fakeDb(rows: Record<string, unknown>[]): Db {
  return {
    query: (async (_sql: string, params: unknown[]) => ({
      rows: rows.filter((r) => r.company_id === params[0] && r.id === params[1])
    })) as unknown as Db['query']
  }
}

const goalRow = {
  id: GOAL_ID,
  company_id: COMPANY_A,
  owner_id: USER,
  title: 'Ship v2',
  progress: 40,
  created_at: new Date('2026-01-01T00:00:00Z')
}

describe('GET /goals/:id', () => {
  it('returns the goal for the caller company', async () => {
    const app = await buildApp({ db: fakeDb([goalRow]), logger: false })
    const res = await app.inject({
      method: 'GET',
      url: `/goals/${GOAL_ID}`,
      headers: { authorization: `Bearer ${USER}:${COMPANY_A}:employee` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id: GOAL_ID, title: 'Ship v2' })
  })

  it('returns 404 for a goal that belongs to another company', async () => {
    const app = await buildApp({ db: fakeDb([goalRow]), logger: false })
    const res = await app.inject({
      method: 'GET',
      url: `/goals/${GOAL_ID}`,
      headers: { authorization: `Bearer ${USER}:${COMPANY_B}:employee` }
    })
    expect(res.statusCode).toBe(404)
  })
})
