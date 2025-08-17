import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { userSchema, type User } from '../types/api'
import { useAuth } from '../auth/AuthContext'

export function useEmployees(search: string, refresh = 0) {
  const { accessToken } = useAuth()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.get<{ data: { users: unknown[] } }>(`/api/users?search=${encodeURIComponent(search)}`, accessToken || undefined)
        const users = res.data.data.users.map((u) => userSchema.parse(u))
        if (active) setData(users)
      } catch {
        if (active) setError('Failed to load employees')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [search, refresh, accessToken])

  return { data, loading, error }
}


