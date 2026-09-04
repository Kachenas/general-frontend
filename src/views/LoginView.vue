<template>
  <div class="flex flex-1 items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-gray-900">Log in</h1>
      <p class="mt-1 text-sm text-gray-500">Welcome back — enter your details to continue.</p>

      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <Input
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autocomplete="email"
          :error-message="errors.email"
        />
        <Input
          v-model="form.password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autocomplete="current-password"
          :error-message="errors.password"
        />

        <Button type="submit" class="w-full" :loading="loading">Log in</Button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Don't have an account?
        <router-link to="/register" class="font-medium text-primary">Sign up</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { getErrorMessage } from '@/utils/errorHandler'
import type { ILoginPayload } from '@/types/authInterface'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const route = useRoute()
const router = useRouter()
const { login, loading } = useAuth()

const form = reactive<ILoginPayload>({ email: '', password: '' })
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!form.email) errors.value.email = 'Email is required'
  if (!form.password) errors.value.password = 'Password is required'
  return Object.keys(errors.value).length === 0
}

async function onSubmit() {
  if (!validate()) return

  try {
    await login({ ...form })
    toast.success('Welcome back')
    router.push((route.query.redirect as string) || '/dashboard')
  } catch (err: unknown) {
    toast.error(getErrorMessage(err))
  }
}
</script>
