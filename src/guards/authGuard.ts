import type { NavigationGuardWithThis } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore()

  await authStore.checkAuth()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }

  return true
}
