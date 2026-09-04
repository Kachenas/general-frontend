<template>
  <div class="space-y-2">
    <h1 class="text-2xl font-bold text-gray-900">Welcome{{ user ? `, ${user.name}` : '' }}</h1>
    <p class="text-sm text-gray-500">You're logged in.</p>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
</script>
