import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const store = useAuthStore()
  const { user, token, loading, error, isAuthenticated } = storeToRefs(store)

  return {
    // Store state (reactive refs via storeToRefs)
    user,
    token,
    loading,
    error,
    isAuthenticated,

    // Actions
    register: store.register,
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
  }
}
