import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { projectSchema, type Project } from '../types/api'
import { useAuth } from '../auth/AuthContext'

export function useProjects(search: string) {
  const { accessToken } = useAuth()
  const [data, setData] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.get<{ data: { projects: unknown[] } }>(`/api/projects?search=${encodeURIComponent(search)}`, accessToken || undefined)
        const items = res.data.data.projects.map((p) => projectSchema.parse(p))
        if (active) setData(items)
      } catch {
        if (active) setError('Failed to load projects')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [search, accessToken])

  return { data, loading, error }
}


