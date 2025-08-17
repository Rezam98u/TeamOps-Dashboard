import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as unknown as { state?: { from?: { pathname?: string } } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="border rounded px-3 py-2 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input className="border rounded px-3 py-2 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button disabled={loading} className="bg-black text-white px-4 py-2 rounded w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="text-sm">
          No account? <Link to="/register" className="underline">Register</Link>
        </div>
      </form>
    </div>
  )
}


