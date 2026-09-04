<template>
  <div>
    <label
      v-if="label"
      :for="id"
      class="mb-1 block text-xs font-medium tracking-wider text-gray-500 uppercase"
    >
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :class="
        cn(
          'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 transition-all outline-none',
          'placeholder:text-gray-400',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          errorMessage && 'border-red-300 focus:border-red-500 focus:ring-red-200',
          !errorMessage && 'border-gray-200',
          disabled && 'cursor-not-allowed opacity-50',
        )
      "
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="errorMessage" class="mt-1 text-xs text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    errorMessage?: string
    id?: string
    autocomplete?: string
  }>(),
  {
    modelValue: '',
    label: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    errorMessage: '',
    id: undefined,
    autocomplete: undefined,
  },
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
