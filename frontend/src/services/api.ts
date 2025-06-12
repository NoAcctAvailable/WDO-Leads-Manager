import axios, { AxiosInstance, AxiosResponse } from 'axios'

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API response interfaces
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/register', userData),
  
  getProfile: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/auth/profile'),
  
  updateProfile: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/auth/profile', data),
  
  changePassword: (data: {
    currentPassword: string
    newPassword: string
    firstName?: string
    lastName?: string
    email?: string
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/auth/change-password', data),
}

// Properties API
export const propertiesApi = {
  getAll: (params?: any): Promise<AxiosResponse<PaginatedResponse<any>>> =>
    api.get('/properties', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/properties/${id}`),
  
  create: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/properties', data),
  
  update: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/properties/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/properties/${id}`),
  
  getStats: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/properties/stats/overview'),
}

// Leads API
export const leadsApi = {
  getAll: (params?: any): Promise<AxiosResponse<PaginatedResponse<any>>> =>
    api.get('/leads', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/leads/${id}`),
  
  create: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/leads', data),
  
  update: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/leads/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/leads/${id}`),
  
  getStats: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/leads/stats/overview'),
}

// Inspections API
export const inspectionsApi = {
  getAll: (params?: any): Promise<AxiosResponse<PaginatedResponse<any>>> =>
    api.get('/inspections', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/inspections/${id}`),
  
  create: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/inspections', data),
  
  update: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/inspections/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/inspections/${id}`),
  
  getStats: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/inspections/stats/overview'),
}

// Users API
export const usersApi = {
  getAll: (params?: any): Promise<AxiosResponse<PaginatedResponse<any>>> =>
    api.get('/users', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/users/${id}`),
  
  update: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/users/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/users/${id}`),
  
  getAssignable: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/users/assignable/list'),
}

export default api 