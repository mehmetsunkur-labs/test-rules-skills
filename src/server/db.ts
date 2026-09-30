import type { Pool } from 'pg'

export type Db = Pick<Pool, 'query'>
