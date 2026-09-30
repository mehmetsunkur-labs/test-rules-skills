import type { Db } from '../db.js'

export interface Goal {
  id: string
  companyId: string
  ownerId: string
  title: string
  progress: number
  createdAt: string
}

interface GoalRow {
  id: string
  company_id: string
  owner_id: string
  title: string
  progress: number
  created_at: Date
}

const COLUMNS = 'id, company_id, owner_id, title, progress, created_at'

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    companyId: row.company_id,
    ownerId: row.owner_id,
    title: row.title,
    progress: row.progress,
    createdAt: row.created_at.toISOString()
  }
}

export async function findGoalById(db: Db, companyId: string, id: string): Promise<Goal | undefined> {
  const { rows } = await db.query<GoalRow>(`SELECT ${COLUMNS} FROM goals WHERE company_id = $1 AND id = $2`, [
    companyId,
    id
  ])
  return rows[0] && toGoal(rows[0])
}

export async function listGoalsByOwner(db: Db, companyId: string, ownerId: string): Promise<Goal[]> {
  const { rows } = await db.query<GoalRow>(
    `SELECT ${COLUMNS} FROM goals WHERE company_id = $1 AND owner_id = $2 ORDER BY created_at DESC`,
    [companyId, ownerId]
  )
  return rows.map(toGoal)
}
