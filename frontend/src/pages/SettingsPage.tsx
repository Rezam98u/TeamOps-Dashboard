import { useAuth } from '../auth/AuthContext'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="text-sm">Email: {user?.email}</div>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => logout()}>Logout</button>
    </div>
  )
}


