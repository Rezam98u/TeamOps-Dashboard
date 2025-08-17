import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../components/DataTable'
import { useKpis } from '../hooks/useKpis'
import type { Kpi } from '../types/api'
import { Modal } from '../components/Modal'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'

export default function KpisPage() {
  const [search, setSearch] = useState('')
  const { data, loading, error } = useKpis(search)
  const { user, accessToken } = useAuth()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ name: string; type: Kpi['type'] | string; isActive: boolean }>({ name: '', type: 'NUMERIC', isActive: true })
  const columns = useMemo<ColumnDef<Kpi, unknown>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Type', accessorKey: 'type' },
      { header: 'Active', cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No') },
    ],
    []
  )
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">KPIs</h1>
        <div className="flex items-center gap-2 ml-auto">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button disabled={!canCreate} onClick={() => setOpen(true)} className="bg-black text-white px-3 py-2 rounded text-sm disabled:opacity-50">+ New</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-sm text-gray-500">Loading...</div> : <DataTable columns={columns} data={data} />}
      <Modal open={open} title="Create KPI" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            await api.post('/api/kpis', { name: form.name, type: form.type, isActive: form.isActive }, accessToken || undefined)
            setOpen(false)
            setForm({ name: '', type: 'NUMERIC', isActive: true })
          }}
        >
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="KPI name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select className="border rounded px-3 py-2 text-sm w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="NUMERIC">NUMERIC</option>
            <option value="PERCENTAGE">PERCENTAGE</option>
            <option value="CURRENCY">CURRENCY</option>
            <option value="BOOLEAN">BOOLEAN</option>
          </select>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 text-sm" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="bg-black text-white px-3 py-2 rounded text-sm">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


