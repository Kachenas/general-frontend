import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ILoginPayload, IRegisterPayload, IUser } from '@/types/authInterface'
import * as authService from '@/services/AuthService'
import { getErrorMessage } from '@/utils/errorHandler'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<IUser | null>(null)
    const token = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const initialized = ref(false)

    const isAuthenticated = computed(() => !!token.value)

    async function register(payload: IRegisterPayload) {
      loading.value = true
      error.value = null
      try {
        const response = await authService.register(payload)
        token.value = response.token
        user.value = response.user
        initialized.value = true
        return response
      } catch (err: unknown) {
        error.value = getErrorMessage(err)
        throw err
      } finally {
        loading.value = false
      }
    }

    async function login(payload: ILoginPayload) {
      loading.value = true
      error.value = null
      try {
        const response = await authService.login(payload)
        token.value = response.token
        user.value = response.user
        initialized.value = true
        return response
      } catch (err: unknown) {
        error.value = getErrorMessage(err)
        throw err
      } finally {
        loading.value = false
      }
    }

    async function logout() {
      loading.value = true
      error.value = null
      try {
        if (token.value) {
          await authService.logout()
        }
      } catch (err: unknown) {
        error.value = getErrorMessage(err)
        // Do not re-throw — the local session is cleared regardless of whether
        // the server-side token revocation succeeded.
      } finally {
        clearSession()
        loading.value = false
      }
    }

    // Validates a persisted token is still accepted by the API. Only needs to
    // run once per app load — subsequent navigations reuse the known state.
    async function checkAuth() {
      if (!token.value || initialized.value) return

      loading.value = true
      try {
        user.value = await authService.fetchCurrentUser()
      } catch {
        clearSession()
      } finally {
        initialized.value = true
        loading.value = false
      }
    }

    function clearSession() {
      user.value = null
      token.value = null
      initialized.value = false
      error.value = null
    }

    // A 401 from any request (see useApi's response interceptor) means the
    // token is no longer valid server-side — drop the local session too.
    window.addEventListener('auth:unauthorized', clearSession)

    return {
      user,
      token,
      loading,
      error,
      isAuthenticated,
      register,
      login,
      logout,
      checkAuth,
      clearSession,
    }
  },
  {
    persist: [
      { pick: ['token'], storage: sessionStorage },
      { pick: ['user'], storage: localStorage },
    ],
  },
)
