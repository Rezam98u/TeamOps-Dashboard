import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { kpiSchema, kpiValueSchema, type Kpi, type KpiValue } from '../types/api'
import { useAuth } from '../auth/AuthContext'

export function useKpis(search: string) {
  const { accessToken } = useAuth()
  const [data, setData] = useState<Kpi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.get<{ data: { kpis: unknown[] } }>(`/api/kpis?search=${encodeURIComponent(search)}`, accessToken || undefined)
        const items = res.data.data.kpis.map((k) => kpiSchema.parse(k))
        if (active) setData(items)
      } catch {
        if (active) setError('Failed to load KPIs')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [search, accessToken])

  return { data, loading, error }
}

export async function fetchKpiValues(kpiId: string, accessToken?: string): Promise<KpiValue[]> {
  const res = await api.get<{ data: { values: unknown[] } }>(`/api/kpis/${kpiId}/values`, accessToken)
  return res.data.data.values.map((v) => kpiValueSchema.parse(v))
}


