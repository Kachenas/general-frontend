import { ApiError } from '@/composables/useApi'

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'An unknown error occurred'
}
