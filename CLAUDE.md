# Frontend — Claude Configuration

## Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Framework        | Vue 3.5 (`<script setup lang="ts">`)             |
| Language         | TypeScript 6.0 (strict)                          |
| Build            | Vite 8                                           |
| State Management | Pinia 4 (setup function syntax) + persisted state|
| Router           | Vue Router 5 (history mode)                      |
| Styling          | Tailwind CSS 4 (utility-first)                   |
| Icons            | Heroicons (`@heroicons/vue`)                     |
| Headless UI      | Headless UI (`@headlessui/vue`) for accessible unstyled primitives (Dialog, Menu, Listbox, Combobox, Switch, Tabs, Disclosure, Popover, Transition) |
| HTTP Client      | Axios (centralized in `src/composables/useApi.ts`) |
| Notifications    | vue-sonner (toast notifications)                 |
| Linting          | ESLint 10 (flat config) + Prettier               |
| Formatting       | Prettier (no semicolons, single quotes) + `prettier-plugin-tailwindcss` |

## Folder Structure

```
src/
├── assets/              # Static assets (images, global CSS)
│   ├── images/
│   └── main.css         # Tailwind directives
├── components/          # Domain-grouped reusable components
│   ├── ui/              #   Shared UI primitives (Button, Input, Dialog, Badge, etc.)
│   └── domains/         #   Domain-specific components
├── composables/         # `use*` composables (bridge stores + local state)
│   └── useApi.ts        #   Axios instance + generic get/post/put/del/upload
├── constants/           # App-wide constants
├── guards/              # Route guards
├── layouts/             # Route-level layout wrappers
├── plugins/             # Vue plugins
├── router/
│   └── index.ts         #   Router instance + route definitions
├── services/            # Stateless API service functions
├── stores/              # Pinia stores (setup function syntax)
├── types/               # TypeScript interfaces & types
├── utils/               # Pure utility functions
│   └── cn.ts            #   clsx + tailwind-merge helper
├── views/               # Page-level components (one per route)
│   └── HomeView.vue
├── App.vue              # Root component
└── main.ts              # App bootstrap (Pinia, Router)
```

## Architecture Flow

```
Component → Composable → Store → Service → useApi (Axios)
               ↑              ↑
          local form      reactive state
          state (ref)     (items, loading, error)
```

1. **Services** (`src/services/`) — stateless async functions that call API endpoints via `useApi.ts` helpers (`get`, `post`, `put`, `del`, `upload`).
2. **Stores** (`src/stores/`) — Pinia stores hold reactive state (`items`, `current`, `loading`, `error`) and delegate to services.
3. **Composables** (`src/composables/`) — wrap stores with `storeToRefs()`, add local form state, and proxy CRUD actions.
4. **Components** use composables to access both global state and local form state.

## Naming Conventions

### Files
| Type        | Convention               | Example                      |
| ----------- | ------------------------ | ---------------------------- |
| Component   | PascalCase `.vue`        | `ProductForm.vue`            |
| UI primitive| PascalCase in `ui/`      | `ui/Button.vue`, `ui/Input.vue` |
| View        | PascalCase + `View`      | `ProductView.vue`            |
| Layout      | PascalCase + `Layout`    | `DashboardLayout.vue`        |
| Composable  | camelCase `use*.ts`      | `useProduct.ts`              |
| Store       | camelCase `*Store.ts`    | `productStore.ts`            |
| Service     | PascalCase `*Service.ts` | `ProductService.ts`          |
| Type        | camelCase `*Interface.ts`| `productInterface.ts`        |
| Utility     | camelCase `.ts`          | `errorHandler.ts`            |

### TypeScript
| Kind              | Convention                        | Example                          |
| ----------------- | --------------------------------- | -------------------------------- |
| Interface         | `I` prefix                        | `IProduct`, `IUser`, `IOrder`    |
| Create type       | `ICreate*` (Omit pattern)         | `ICreateOrder`, `ICreateBundle`  |
| Union type        | No prefix, PascalCase             | `OrderStatus`, `PaymentMethod`   |

### Variables & Functions
| Kind             | Convention                                 | Example                          |
| ---------------- | ------------------------------------------ | -------------------------------- |
| Reactive state   | `ref<T>()` with camelCase                  | `const loading = ref(false)`     |
| Computed          | `computed(() => ...)` camelCase            | `const isAuthenticated = computed(...)` |
| Boolean refs     | `is*`, `show*`, `has*` prefix              | `isScrolled`, `showForm`         |
| Event handlers   | `handle*` or `on*` prefix                  | `handleLogout()`, `onSubmit()`   |
| CRUD actions     | `fetchAll`, `fetchOne`, `create`, `update`, `remove` | Standard across all stores |
| Store export     | `use*Store`                                | `useAuthStore`, `useProductStore` |
| Composable export| `use*`                                     | `useProduct()`, `useAuth()`      |

### Components (SFC)
- Always `<script setup lang="ts">` — never `defineComponent()`
- Template order: `<template>` → `<script setup>`
- Props: `defineProps<{ prop: Type }>()` (type-only, no runtime)
- Emits: `defineEmits<{ (e: 'event', payload: T): void }>()`
- No `<style>` blocks — use Tailwind utility classes

## Critical Conventions

### 1. `storeToRefs()` is MANDATORY (CRITICAL)

When destructuring reactive state from a Pinia store inside a composable, you MUST use `storeToRefs()`. Without it, the destructured values lose reactivity and the UI will not update.

```typescript
// CORRECT:
import { storeToRefs } from 'pinia'
const store = useEntityStore()
const { items, current, loading, error } = storeToRefs(store)

// WRONG (breaks reactivity):
const store = useEntityStore()
const { items, current, loading, error } = store // BROKEN — not reactive
```

Actions (functions) do NOT need `storeToRefs` — only state refs do.

### 2. Composable Return Order

Composable return objects MUST follow this grouping order:
1. **Store state** (reactive refs via `storeToRefs`)
2. **Local state** (component-scoped refs)
3. **Actions** (functions)

```typescript
return {
  // Store state (reactive refs)
  items, current, loading, error,
  // Local state
  entity, coverImage,
  // Actions
  fetchAll, create, update, remove, clear,
}
```

### 3. No Response Envelope

The backend returns direct data — NOT wrapped in `{ success: true, data: ... }`. Services and stores must handle raw response data:

```typescript
// CORRECT — backend returns the entity directly
const created = await entityService.createEntity(data) // returns IEntity
items.value.unshift(created)

// WRONG — do not destructure a success/data wrapper
const { data } = await entityService.createEntity(data) // NEVER — no envelope exists
```

### 4. Store Error Handling Pattern (MANDATORY)

Every async store action MUST follow this exact pattern:

```typescript
async function action() {
  loading.value = true       // 1. Set loading
  error.value = null         // 2. Clear previous error
  try {
    // 3. Perform operation
  } catch (err: unknown) {
    error.value = getErrorMessage(err)  // 4. Store error message
    throw err                           // 5. Re-throw for caller
  } finally {
    loading.value = false    // 6. Clear loading in finally
  }
}
```

- Errors are BOTH stored in the `error` ref AND re-thrown
- `loading` is always reset in `finally`, never in `try` or `catch`

### 5. Standard Store State Shape

Every domain store MUST have these four core refs:

```typescript
const items = ref<IEntity[]>([])           // Collection
const current = ref<IEntity | undefined>() // Single selected item
const loading = ref(false)                 // Loading indicator
const error = ref<string | null>(null)     // Error message
```

### 6. Component Script Setup Only

- Always `<script setup lang="ts">` — never `defineComponent()`
- Props: `defineProps<{ ... }>()` (type-only, no runtime validation)
- Emits: `defineEmits<{ (e: 'event', payload: T): void }>()`
- No `<style>` blocks — use Tailwind utility classes

### 7. File Upload Composable Pattern

File refs are always `ref<File | null>(null)` — managed locally in the composable, passed to store actions on submit:

```typescript
const coverImage = ref<File | null>(null)
function addCoverImage(file: File | FileList | null) {
  if (!file) { coverImage.value = null; return }
  coverImage.value = file instanceof File ? file : (file[0] ?? null)
}
```

## Store Pattern (Pinia)

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IEntity } from '@/types/entityInterface'
import * as entityService from '@/services/EntityService'
import { getErrorMessage } from '@/utils/errorHandler'

export const useEntityStore = defineStore('entity', () => {
  const items = ref<IEntity[]>([])
  const current = ref<IEntity | undefined>()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await entityService.fetchEntities()
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clear() {
    items.value = []
    current.value = undefined
    error.value = null
  }

  return { items, current, loading, error, fetchAll, clear }
})
```

## Composable Pattern

```ts
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEntityStore } from '@/stores/entityStore'
import type { IEntity } from '@/types/entityInterface'

export function useEntity() {
  const store = useEntityStore()
  const { items, current, loading, error } = storeToRefs(store)

  const entity = ref<IEntity>({ /* defaults */ })

  async function fetchAll() { return store.fetchAll() }
  async function create(e: IEntity) { return store.create(e) }

  return {
    // Store state (reactive refs)
    items, current, loading, error,
    // Local state
    entity,
    // Actions
    fetchAll, create,
  }
}
```

## Service Pattern

```ts
import { get, post, put, del } from '@/composables/useApi'
import type { IEntity } from '@/types/entityInterface'

export async function fetchEntities(): Promise<IEntity[]> {
  return await get<IEntity[]>('/entities')
}

export async function createEntity(data: IEntity): Promise<IEntity> {
  return await post<IEntity>('/entities', data)
}
```

## Routing

- History mode via `createWebHistory()`
- Path-based navigation (no named routes): `router.push('/dashboard')`
- Meta fields for auth: `requiresAuth`, `requiresAdmin`
- Eager imports for all views (lazy-load only if bundle size becomes a concern)

## Styling

- **Tailwind CSS 4** — utility-first, all styling via class attributes
- **Headless UI** (`@headlessui/vue`) — unstyled accessible primitives
- **No `<style>` blocks** unless absolutely necessary
- **`cn()` utility** — conditional class merging via `clsx` + `tailwind-merge`
- **Prettier plugin** — `prettier-plugin-tailwindcss` for automatic class sorting
- **Icons:** Heroicons (`@heroicons/vue/24/outline`, `@heroicons/vue/24/solid`)

## API Layer (`useApi.ts`)

- Central Axios instance with base URL from `VITE_API_BASE_URL`
- Request interceptor: attaches Bearer token from Pinia/sessionStorage/localStorage
- Response interceptor: dispatches `auth:unauthorized` custom event on 401
- Custom `ApiError` class with status code
- Generic typed helpers: `get<T>`, `post<T>`, `put<T>`, `del<T>`, `upload<T>`

## Environment Variables

| Variable             | Purpose                     |
| -------------------- | --------------------------- |
| `VITE_API_BASE_URL`  | Backend API base URL        |

## Commands

| Command              | Purpose                          |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start Vite dev server            |
| `npm run build`      | Type check + production build    |
| `npm run preview`    | Preview production build         |

## `cn()` Utility

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
