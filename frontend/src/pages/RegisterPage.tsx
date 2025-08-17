import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ email, password, firstName, lastName })
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Register</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm">First Name</label>
          <input className="border rounded px-3 py-2 w-full" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Last Name</label>
          <input className="border rounded px-3 py-2 w-full" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="border rounded px-3 py-2 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input className="border rounded px-3 py-2 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button disabled={loading} className="bg-black text-white px-4 py-2 rounded w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <div className="text-sm">
          Already have an account? <Link to="/login" className="underline">Login</Link>
        </div>
      </form>
    </div>
  )
}


