import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { api } from '../lib/api'

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.union([z.literal('ADMIN'), z.literal('MANAGER'), z.literal('EMPLOYEE')]),
  isActive: z.boolean().optional(),
})

export type User = z.infer<typeof userSchema>

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Attempt to restore session using refresh token cookie
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const refreshed = await api.post<{ data: { accessToken: string } }>('/api/auth/refresh', {})
        const token = refreshed.data.data.accessToken
        setAccessToken(token)
        // Fetch profile
        const me = await api.get<{ data: { user: User } }>('/api/auth/me', token)
        const parsed = userSchema.parse(me.data.data.user)
        if (active) setUser(parsed)
      } catch {
        // not logged in
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<{ data: { user: User; accessToken: string } }>('/api/auth/login', { email, password })
    const { user: u, accessToken: token } = res.data.data
    setUser(userSchema.parse(u))
    setAccessToken(token)
  }

  const register = async (payload: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await api.post<{ data: { user: User; accessToken: string } }>('/api/auth/register', payload)
    const { user: u, accessToken: token } = res.data.data
    setUser(userSchema.parse(u))
    setAccessToken(token)
  }

  const logout = async () => {
    await api.post('/api/auth/logout', {})
    setUser(null)
    setAccessToken(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isLoading, login, register, logout }),
    [user, accessToken, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
// Deliberately exporting context for advanced consumers
export default AuthContext

