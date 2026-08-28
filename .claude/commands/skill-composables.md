# Skill: Composables

## Naming

- File: `src/composables/use<Domain>.ts`
- Export: `export function use<Domain>() { ... }`
- Must start with `use` prefix

## Standard CRUD Composable Template

```ts
// src/composables/useEntity.ts
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEntityStore } from '@/stores/entityStore'
import type { IEntity } from '@/types/entityInterface'

export function useEntity() {
  const store = useEntityStore()
  const { items, current, loading, error } = storeToRefs(store)

  // Local form state (fresh instance per composable call)
  const entity = ref<IEntity>({
    name: '',
    description: '',
    // ... domain-specific defaults
  })

  // Proxy store actions
  async function fetchAll() {
    return store.fetchAll()
  }

  async function fetchOne(id: string) {
    return store.fetchOne(id)
  }

  async function create(e: IEntity) {
    return store.create(e)
  }

  async function update(id: string, payload: Partial<IEntity>) {
    return store.update(id, payload)
  }

  async function remove(id: string) {
    return store.remove(id)
  }

  function clear() {
    store.clear()
    entity.value = {
      name: '',
      description: '',
      // ... reset to defaults
    }
  }

  return {
    // Store state (reactive refs via storeToRefs)
    items,
    current,
    loading,
    error,

    // Local form state
    entity,

    // Actions
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    clear,
  }
}
```

## Key Rules

### ⚠️ RULE 1: `storeToRefs()` is MANDATORY (CRITICAL)

**This is the most common source of bugs.** When destructuring reactive state from a Pinia store, you MUST use `storeToRefs()`. Without it, the destructured values are plain (non-reactive) copies and the UI will NOT update when the store changes.

```typescript
// ✅ CORRECT — reactive, UI updates when store changes
import { storeToRefs } from 'pinia'
const store = useEntityStore()
const { items, current, loading, error } = storeToRefs(store)

// ❌ WRONG — non-reactive copies, UI will NOT update
const store = useEntityStore()
const { items, current, loading, error } = store
```

**Note:** Only state (refs/computed) needs `storeToRefs()`. Actions (functions) should be accessed directly from the store: `store.fetchAll`, `store.create`, etc.

### RULE 2: Return Object Order
Return objects MUST follow this grouping:
1. **Store state** (reactive refs from `storeToRefs`)
2. **Local state** (component-scoped refs)
3. **Actions** (functions)

### RULE 3: Local Form State
Local form state is a `ref<IEntity>()` with sensible defaults — each composable call gets a fresh instance.

### RULE 4: Proxy Actions
Composables proxy store actions and may add extra logic (e.g., file handling in `useProduct`).

### RULE 5: No Lifecycle Hooks
Standard CRUD composables do NOT use lifecycle hooks — they are stateless wrappers. Only specialized composables (e.g., `useInactivityLogout`) use `onMounted`/`onUnmounted`.

## Composable with Computed Properties

For composables needing derived data, add `computed` values:

```ts
// From useFinancial.ts
export function useIncome() {
  const store = useIncomeStore()
  const { items, current, loading, error } = storeToRefs(store)

  const totalMonthlyIncome = computed(() => {
    return items.value
      .filter((income) => income.isActive)
      .reduce((sum, income) => {
        const multiplier = getMonthlyMultiplier(income.frequency)
        return sum + income.amount * multiplier
      }, 0)
  })

  return {
    items, current, loading, error,
    totalMonthlyIncome,
    fetchAll: store.fetchAll,
    fetchOne: store.fetchOne,
    create: store.create,
    update: store.update,
    remove: store.remove,
    clear: store.clear,
  }
}
```

## Composable with File Handling

For entities with file uploads, manage file refs locally:

```ts
// From useProduct.ts
export function useProduct() {
  const store = useProductStore()
  const { items, current, loading, error } = storeToRefs(store)

  const product = ref<IProduct>({ /* defaults */ })
  const coverImage = ref<File | null>(null)
  const uploadedFile = ref<File | null>(null)

  function addCoverImage(file: File | FileList | null) {
    if (!file) { coverImage.value = null; return }
    coverImage.value = file instanceof File ? file : (file[0] ?? null)
  }

  function removeCoverImage() {
    coverImage.value = null
  }

  async function create(p: IProduct) {
    return store.create(p, coverImage.value, uploadedFile.value)
  }

  return {
    items, current, loading, error,
    product, coverImage, uploadedFile,
    addCoverImage, removeCoverImage,
    fetchAll, create, update, remove,
  }
}
```

## Composable with Lifecycle Hooks

For composables that manage side effects (event listeners, timers), use lifecycle hooks:

```ts
// From useInactivityLogout.ts
export function useInactivityLogout() {
  const router = useRouter()
  const authStore = useAuthStore()

  const showInactivityWarning = ref(false)
  const secondsUntilLogout = ref(30)
  let inactivityTimer: number | null = null

  const resetTimer = () => { /* ... */ }
  const cleanup = () => { /* clear timers, remove listeners */ }

  onMounted(() => {
    if (authStore.isAuthenticated) {
      setupListeners()
      resetTimer()
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    showInactivityWarning,
    secondsUntilLogout,
    stayLoggedIn,
    cleanup,
  }
}
```

## Thin Wrapper Composable

For simple store access without extra state:

```ts
// From useAuth.ts
export function useAuth() {
  const authStore = useAuthStore()
  return {
    isAuthenticated: authStore.isAuthenticated,
    login: authStore.login,
    logout: authStore.logout,
  }
}
```

## Utility Composable (No Store)

For shared logic without store involvement:

```ts
// From useSanitize.ts
export function useSanitize() {
  const sanitize = (dirty: string) => {
    if (!dirty) return ''
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'strong', /* ... */],
      ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
    })
  }
  return { sanitize }
}
```

## Existing Composables Reference

| Composable             | Purpose                                    | Local State |
| ---------------------- | ------------------------------------------ | ----------- |
| `useApi`               | Axios instance + HTTP helpers (not a composable pattern — it's a module) | N/A |
| `useAuth`              | Thin wrapper around authStore              | None        |
| `useProduct`           | Product CRUD + file upload refs            | `product`, `coverImage`, `uploadedFile` |
| `useBundle`            | Bundle CRUD                                | `bundle`    |
| `usePromo`             | Promo code CRUD                            | `promo`     |
| `useOrder`             | Order CRUD                                 | `order`     |
| `useFinancial`         | Multiple composables: `useIncome`, `useExpense`, `useSavings`, `useDebt`, `useFinancialGoal`, `useFinancialMetrics` | computed aggregations |
| `useInactivityLogout`  | Session timeout with warning dialog        | `showInactivityWarning`, `secondsUntilLogout` |
| `useSanitize`          | DOMPurify wrapper for Quill HTML           | None        |
