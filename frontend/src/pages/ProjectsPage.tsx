import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../components/DataTable'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../types/api'
import { Modal } from '../components/Modal'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const { data, loading, error } = useProjects(search)
  const { user, accessToken } = useAuth()
  const canAssign = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [assignOpen, setAssignOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [userId, setUserId] = useState('')
  const columns = useMemo<ColumnDef<Project, unknown>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Manager', cell: ({ row }) => `${row.original.manager?.firstName ?? ''} ${row.original.manager?.lastName ?? ''}` },
      { header: 'Status', accessorKey: 'status' },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              disabled={!canAssign}
              onClick={() => { setSelectedProjectId(row.original.id); setAssignOpen(true) }}
              className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            >Assign</button>
            <button
              disabled={!canAssign}
              onClick={() => { setSelectedProjectId(row.original.id); setRemoveOpen(true) }}
              className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            >Remove</button>
          </div>
        ),
      },
    ],
    [canAssign]
  )
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <input className="border rounded px-3 py-2 text-sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-sm text-gray-500">Loading...</div> : <DataTable columns={columns} data={data} />}
      <Modal open={assignOpen} title="Assign Member" onClose={() => setAssignOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            await api.post(`/api/projects/${selectedProjectId}/assign`, { userId }, accessToken || undefined)
            setAssignOpen(false)
            setUserId('')
          }}
        >
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 text-sm" onClick={() => setAssignOpen(false)}>Cancel</button>
            <button type="submit" className="bg-black text-white px-3 py-2 rounded text-sm">Assign</button>
          </div>
        </form>
      </Modal>
      <Modal open={removeOpen} title="Remove Member" onClose={() => setRemoveOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            await api.delete(`/api/projects/${selectedProjectId}/assign/${userId}`, accessToken || undefined)
            setRemoveOpen(false)
            setUserId('')
          }}
        >
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 text-sm" onClick={() => setRemoveOpen(false)}>Cancel</button>
            <button type="submit" className="bg-black text-white px-3 py-2 rounded text-sm">Remove</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


