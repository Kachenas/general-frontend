<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-gray-100 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <router-link to="/dashboard" class="text-lg font-bold text-gray-900">App</router-link>
        <div class="flex items-center gap-4 text-sm">
          <span v-if="user" class="text-gray-500">{{ user.name }}</span>
          <Button variant="ghost" size="sm" :loading="loading" @click="handleLogout">Log out</Button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const { user, loading, logout } = useAuth()

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>
