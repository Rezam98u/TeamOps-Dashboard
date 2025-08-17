import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

// Basic typed axios wrapper with optional bearer token
class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
      withCredentials: true,
    })
  }

  get<T = unknown>(url: string, accessToken?: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, this.withAuth(accessToken, config))
  }

  post<T = unknown>(url: string, data?: unknown, accessToken?: string, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, this.withAuth(accessToken, config))
  }

  put<T = unknown>(url: string, data?: unknown, accessToken?: string, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, this.withAuth(accessToken, config))
  }

  delete<T = unknown>(url: string, accessToken?: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, this.withAuth(accessToken, config))
  }

  private withAuth(accessToken?: string, config?: AxiosRequestConfig): AxiosRequestConfig {
    const headers = { ...(config?.headers || {}) } as Record<string, string>
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    return { ...(config || {}), headers }
  }
}

export const api = new ApiClient()


