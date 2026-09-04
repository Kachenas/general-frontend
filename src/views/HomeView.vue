<template>
  <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
    <h1 class="text-4xl font-bold">Welcome</h1>
    <p class="mt-2 text-gray-500">Sana ready ka na</p>

    <div class="mt-6 flex gap-3">
      <router-link
        v-if="!isAuthenticated"
        to="/register"
        class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:shadow-md"
      >
        Get started
      </router-link>
      <router-link
        v-else
        to="/dashboard"
        class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:shadow-md"
      >
        Go to dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated } = useAuth()
</script>
