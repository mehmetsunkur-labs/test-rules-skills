import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../api/client.js'

interface Goal {
  id: string
  title: string
  progress: number
}

export function GoalList({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation()
  const goals = useQuery({
    queryKey: ['goals', ownerId],
    queryFn: () => apiFetch<Goal[]>(`/goals?ownerId=${encodeURIComponent(ownerId)}`)
  })

  if (goals.isPending) return <p role="status">{t('common.loading')}</p>
  if (goals.isError) return <p role="alert">{t('goals.loadError')}</p>
  if (goals.data.length === 0) return <p>{t('goals.empty')}</p>

  return (
    <ul aria-label={t('goals.listLabel')}>
      {goals.data.map((goal) => (
        <li key={goal.id}>
          {goal.title}
          <progress value={goal.progress} max={100} aria-label={t('goals.progress', { title: goal.title })} />
        </li>
      ))}
    </ul>
  )
}
