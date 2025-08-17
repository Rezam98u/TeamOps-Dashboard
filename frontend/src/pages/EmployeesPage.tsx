import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../components/DataTable'
import { useEmployees } from '../hooks/useEmployees'
import type { User } from '../types/api'
import { Modal } from '../components/Modal'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'

export default function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = useEmployees(search, refresh)
  const { accessToken, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE' as User['role'] })
  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      { header: 'Name', accessorKey: 'firstName', cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}` },
      { header: 'Email', accessorKey: 'email' },
      { header: 'Role', accessorKey: 'role' },
      { header: 'Active', cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No') },
    ],
    []
  )
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <div className="flex items-center gap-2 ml-auto">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button disabled={!isAdmin} onClick={() => setOpen(true)} className="bg-black text-white px-3 py-2 rounded text-sm disabled:opacity-50">+ New</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-sm text-gray-500">Loading...</div> : <DataTable columns={columns} data={data} />}
      <Modal open={open} title="Create Employee" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            await api.post('/api/users', form, accessToken || undefined)
            setOpen(false)
            setForm({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE' })
            setRefresh((r) => r + 1)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-3 py-2 text-sm" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select className="border rounded px-3 py-2 text-sm w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 text-sm" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="bg-black text-white px-3 py-2 rounded text-sm">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


