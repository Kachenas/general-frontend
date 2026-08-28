import axios, { AxiosError } from 'axios'

import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosProgressEvent,
} from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  // withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  let token = null

  // Try to get the token from Pinia persist format (sessionStorage)
  const authStore = sessionStorage.getItem('auth')
  if (authStore) {
    try {
      const parsed = JSON.parse(authStore)
      token = parsed.token
    } catch (e) {
      console.error('Failed to parse auth store from sessionStorage', e)
    }
  }

  // Fallback to direct token in sessionStorage
  if (!token) {
    token = sessionStorage.getItem('token')
  }

  // Fallback to localStorage
  if (!token) {
    token = localStorage.getItem('token')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string; error?: string; errors?: string[] }>
    let message: string

    if (axiosErr.response?.data?.errors && Array.isArray(axiosErr.response.data.errors)) {
      message = axiosErr.response.data.errors.join(', ')
    } else {
      message = axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message
    }

    throw new ApiError(message, axiosErr.response?.status)
  }
  if (error instanceof Error) throw error
  throw new ApiError('An unknown error occurred')
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.get<T>(url, config)
    return res.data
  } catch (err) {
    handleAxiosError(err)
  }
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.post<T>(url, data, config)
    return res.data
  } catch (err) {
    handleAxiosError(err)
  }
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.put<T>(url, data, config)
    return res.data
  } catch (err) {
    handleAxiosError(err)
  }
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.delete<T>(url, config)
    return res.data
  } catch (err) {
    handleAxiosError(err)
  }
}

export async function upload<T>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return res.data
  } catch (err) {
    handleAxiosError(err)
  }
}

export default api
