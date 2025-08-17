import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchKpiValues } from '../hooks/useKpis'

export default function DashboardPage() {
  const { user, accessToken } = useAuth()
  const [series, setSeries] = useState<{ date: string; value: number }[]>([])
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        // Demo: attempt to load values for a known KPI id if available from env; otherwise, empty
        const demoKpiId = import.meta.env.VITE_DEMO_KPI_ID as string | undefined
        if (!demoKpiId) return
        const values = await fetchKpiValues(demoKpiId, accessToken || undefined)
        if (active) setSeries(values.map((v) => ({ date: v.date.slice(0, 10), value: v.value })))
      } catch {
        // ignore
      }
    })()
    return () => { active = false }
  }, [accessToken])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Welcome, {user?.firstName} {user?.lastName}</p>
      <div className="mt-4">
        {series.length === 0 ? (
          <div className="text-sm text-gray-500">Add data to see KPI charts.</div>
        ) : (
          <ul className="text-sm text-gray-700 list-disc pl-6">
            {series.map((p) => (
              <li key={p.date}>{p.date}: {p.value}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


