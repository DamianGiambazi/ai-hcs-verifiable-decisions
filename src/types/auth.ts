export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    email: string
    name?: string
  }
  error?: string
}

export interface AuthUser {
  id: string
  email: string
  name?: string
}
