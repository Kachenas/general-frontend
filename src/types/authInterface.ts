import type { IRole } from '@/types/roleInterface'

export interface IUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  roles: IRole[]
  created_at: string
  updated_at: string
}

export interface IRegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: IUser
  token: string
}
