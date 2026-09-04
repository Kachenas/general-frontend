<template>
  <div class="flex flex-1 items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-gray-900">Create an account</h1>
      <p class="mt-1 text-sm text-gray-500">Sign up to get started.</p>

      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <Input v-model="form.name" label="Name" placeholder="Jane Doe" :error-message="errors.name" />
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
          autocomplete="new-password"
          :error-message="errors.password"
        />
        <Input
          v-model="form.password_confirmation"
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          autocomplete="new-password"
          :error-message="errors.password_confirmation"
        />

        <Button type="submit" class="w-full" :loading="loading">Sign up</Button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Already have an account?
        <router-link to="/login" class="font-medium text-primary">Log in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { getErrorMessage } from '@/utils/errorHandler'
import type { IRegisterPayload } from '@/types/authInterface'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const { register, loading } = useAuth()

const form = reactive<IRegisterPayload>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!form.name) errors.value.name = 'Name is required'
  if (!form.email) errors.value.email = 'Email is required'
  if (!form.password) errors.value.password = 'Password is required'
  if (form.password && form.password !== form.password_confirmation) {
    errors.value.password_confirmation = 'Passwords do not match'
  }
  return Object.keys(errors.value).length === 0
}

async function onSubmit() {
  if (!validate()) return

  try {
    await register({ ...form })
    toast.success('Account created')
    router.push('/dashboard')
  } catch (err: unknown) {
    toast.error(getErrorMessage(err))
  }
}
</script>
