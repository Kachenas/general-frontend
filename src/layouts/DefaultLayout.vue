<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-gray-100 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <router-link to="/" class="text-lg font-bold text-gray-900">App</router-link>
        <nav class="flex items-center gap-4 text-sm font-medium">
          <template v-if="isAuthenticated">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="text-gray-600 hover:text-gray-900">Log in</router-link>
            <router-link
              to="/register"
              class="rounded-lg bg-primary px-4 py-2 text-white hover:shadow-md"
            >
              Sign up
            </router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="flex flex-1 flex-col">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated } = useAuth()
</script>
