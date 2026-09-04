import { get, post } from '@/composables/useApi'
import type { AuthResponse, ILoginPayload, IRegisterPayload, IUser } from '@/types/authInterface'

export async function register(payload: IRegisterPayload): Promise<AuthResponse> {
  return await post<AuthResponse>('/register', payload)
}

export async function login(payload: ILoginPayload): Promise<AuthResponse> {
  return await post<AuthResponse>('/login', payload)
}

export async function logout(): Promise<void> {
  return await post<void>('/logout')
}

export async function fetchCurrentUser(): Promise<IUser> {
  return await get<IUser>('/user')
}
