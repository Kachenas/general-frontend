# Skill: Vue Components

## SFC Structure

All components use `<script setup lang="ts">`. Template comes first. Style blocks are avoided — use Tailwind utility classes inline.

```vue
<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Page Title</h1>
    <!-- Content styled with Tailwind utilities -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEntity } from '@/composables/useEntity'
import type { IEntity } from '@/types/entityInterface'

// Props & Emits
const props = defineProps<{
  entity?: IEntity | null
  submitLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: IEntity): void
  (e: 'close'): void
}>()

// Composable usage
const { items, loading, error, fetchAll } = useEntity()

// Local state
const showDialog = ref(false)

// Lifecycle
onMounted(() => {
  loadData()
})

// Methods
async function loadData() {
  try {
    await fetchAll()
  } catch (err) {
    console.error(err)
  }
}
</script>
```

## Props

- Use **type-only** `defineProps<{ ... }>()` — no runtime validation
- Optional props use `?` in the interface
- For prop defaults, use `withDefaults()` only when needed
- MongoDB IDs are `_id?: string`

```ts
const props = defineProps<{
  product?: IProduct | null
  submitLabel?: string
}>()
```

## Emits

- Use **type-only** `defineEmits<{ ... }>()`
- Event names are camelCase verbs: `submit`, `close`, `cancel`, `update`

```ts
const emit = defineEmits<{
  (e: 'submit', product: IProduct): void
  (e: 'close'): void
  (e: 'cancel'): void
}>()
```

## Component Organization by Domain

Components are grouped by domain feature inside `src/components/`:

```
components/
├── ui/              # Shared UI primitives (see below)
├── CheckOut/        # Checkout flow components
├── Financial/       # Financial tracker components
├── Home/            # Landing page sections
├── Messages/        # Messaging components
├── Orders/          # Order management components
├── Products/        # Product CRUD components
├── Reports/         # Report components
├── Settings/        # Settings/admin components
├── FileUploader.vue # Shared file upload component
└── RichTextEditor.vue # Shared Quill editor wrapper
```

## Shared UI Primitives (`components/ui/`)

Build a small set of reusable primitives styled with Tailwind. These wrap native elements or Headless UI components:

```
ui/
├── Button.vue       # <button> with variant/size props
├── Input.vue        # <input> with label, error, and help text
├── Select.vue       # Headless UI Listbox wrapper
├── Dialog.vue       # Headless UI Dialog wrapper
├── Badge.vue        # Status badge (colored pill)
├── Toast.vue        # Notification toast
└── Spinner.vue      # Loading spinner
```

### Example: `ui/Button.vue`

```vue
<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
      sizeClasses,
      variantClasses,
      (disabled || loading) && 'opacity-50 cursor-not-allowed',
    )"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const sizeClasses = computed(() => ({
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}[props.size]))

const variantClasses = computed(() => ({
  primary: 'bg-gradient-to-r from-orange-400 to-primary text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-primary/50',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
}[props.variant]))
</script>
```

### Example: `ui/Input.vue`

```vue
<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="cn(
        'w-full rounded-xl border bg-orange-50/30 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all',
        'placeholder:text-gray-400',
        'focus:border-primary focus:ring-2 focus:ring-primary/20',
        errorMessage && 'border-red-300 focus:border-red-500 focus:ring-red-200',
        !errorMessage && 'border-gray-200',
        disabled && 'cursor-not-allowed opacity-50',
      )"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="errorMessage" class="mt-1 text-xs text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    errorMessage?: string
    id?: string
  }>(),
  { type: 'text' },
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
```

## Notifications Pattern

Use a toast composable or `vue-sonner` for user feedback:

```ts
import { toast } from 'vue-sonner'

// Success
toast.success('Product created successfully')

// Error
toast.error(getErrorMessage(err))
```

Or build a custom `useToast()` composable:

```ts
const { showToast } = useToast()
showToast({ message: 'Product created', type: 'success' })
```

## Dialog Pattern (Headless UI)

Use `@headlessui/vue` Dialog for modals:

```vue
<template>
  <TransitionRoot :show="open" as="template">
    <Dialog class="relative z-50" @close="$emit('close')">
      <TransitionChild
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <DialogTitle class="text-lg font-semibold text-gray-900">
                {{ title }}
              </DialogTitle>
              <slot />
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  Dialog, DialogPanel, DialogTitle,
  TransitionRoot, TransitionChild,
} from '@headlessui/vue'

defineProps<{
  open: boolean
  title: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>
```

## Delete Confirmation Pattern

```ts
const showDeleteDialog = ref(false)
const entityToDelete = ref<IEntity | null>(null)

function confirmDelete(entity: IEntity) {
  entityToDelete.value = entity
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!entityToDelete.value?._id) return
  try {
    await remove(entityToDelete.value._id)
    toast.success('Deleted successfully')
  } catch (err: unknown) {
    toast.error(getErrorMessage(err))
  } finally {
    showDeleteDialog.value = false
  }
}
```

## Form Components

Form components receive an entity via props and emit on submit:

```vue
<script setup lang="ts">
const props = defineProps<{
  entity?: IEntity | null
  submitLabel?: string
}>()
const emit = defineEmits<{
  (e: 'submit', entity: IEntity): void
  (e: 'close'): void
}>()

const localEntity = ref<IEntity>({ /* defaults */ })
const errors = ref<Record<string, string>>({})

// Watch prop changes to reset form
watch(
  () => props.entity,
  (newVal) => resetForm(newVal),
  { immediate: true },
)

function validate(): boolean {
  errors.value = {}
  if (!localEntity.value.title) errors.value.title = 'Required field'
  if (localEntity.value.price <= 0) errors.value.price = 'Must be greater than 0'
  return Object.keys(errors.value).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...localEntity.value })
}
</script>
```

## View Components (Pages)

Views live in `src/views/` with the `*View.vue` suffix. They:
1. Import composables for state and actions
2. Fetch data in `onMounted`
3. Orchestrate child components
4. Handle dialogs and toasts

```vue
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Products</h1>
      <Button @click="openAdd">Add Product</Button>
    </div>

    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <!-- Product list -->
    <div v-for="product in items" :key="product._id" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <!-- ... -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProduct } from '@/composables/useProduct'
import Button from '@/components/ui/Button.vue'

const { items, error, fetchAll, create, update, remove } = useProduct()

const showForm = ref(false)
const editing = ref<IProduct | null>(null)

onMounted(() => { fetchAll() })
</script>
```

## Responsive Design

Use Tailwind responsive prefixes instead of a display composable:

```html
<!-- Hidden on mobile, visible on md+ -->
<nav class="hidden md:flex items-center gap-4">...</nav>

<!-- Full width on mobile, half on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">...</div>

<!-- Mobile menu button -->
<button class="md:hidden" @click="menuOpen = !menuOpen">
  <Bars3Icon class="h-6 w-6" />
</button>
```

## Icons

Use Heroicons (`@heroicons/vue`):

```vue
<script setup lang="ts">
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { ShieldCheckIcon } from '@heroicons/vue/24/solid'
</script>

<template>
  <PlusIcon class="h-5 w-5" />
  <TrashIcon class="h-5 w-5 text-red-500" />
</template>
```
