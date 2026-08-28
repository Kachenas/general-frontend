# Skill: State Management (Pinia)

## Setup

Pinia is initialized in `src/main.ts` with the persisted state plugin:

```ts
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
```

## Store Creation Pattern

All stores use the **setup function syntax** (not options API):

```ts
// src/stores/entityStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IEntity } from '@/types/entityInterface'
import * as entityService from '@/services/EntityService'
import { getErrorMessage } from '@/utils/errorHandler'

export const useEntityStore = defineStore('entity', () => {
  // State
  const items = ref<IEntity[]>([])
  const current = ref<IEntity | undefined>()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await entityService.fetchEntities()
      return items.value
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      const entity = await entityService.fetchEntity(id)
      current.value = entity
      return entity
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(data: IEntity) {
    loading.value = true
    error.value = null
    try {
      const created = await entityService.createEntity(data)
      items.value.unshift(created)  // Add to beginning of list
      return created
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: Partial<IEntity>) {
    loading.value = true
    error.value = null
    try {
      const updated = await entityService.updateEntity(id, payload)
      const idx = items.value.findIndex((e) => e._id === updated._id)
      if (idx >= 0) items.value[idx] = updated
      if (current.value && current.value._id === updated._id) current.value = updated
      return updated
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await entityService.deleteEntity(id)
      items.value = items.value.filter((e) => e._id !== id)
      if (current.value?._id === id) current.value = undefined
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

  return {
    items, current, loading, error,
    fetchAll, fetchOne, create, update, remove, clear,
  }
})
```

## Standard State Shape

Every domain store has the same four core refs:

```ts
const items = ref<IEntity[]>([])           // Collection
const current = ref<IEntity | undefined>() // Single selected item
const loading = ref(false)                 // Loading indicator
const error = ref<string | null>(null)     // Error message
```

## Standard Actions

| Action     | Behavior                                                       |
| ---------- | -------------------------------------------------------------- |
| `fetchAll` | Fetch all items, replace `items` array                         |
| `fetchOne` | Fetch single item, set `current`                               |
| `create`   | Create item, `unshift` into `items`                            |
| `update`   | Update item, patch in `items` array by `_id`, update `current` |
| `remove`   | Delete item, filter from `items`, clear `current` if matching  |
| `clear`    | Reset all state to defaults                                    |

## Error Handling Pattern (MANDATORY)

> **⚠️ Every async store action MUST follow this exact pattern. Deviations cause inconsistent loading states or swallowed errors.**

```ts
async function action() {
  loading.value = true      // 1. Set loading BEFORE operation
  error.value = null        // 2. Clear previous error BEFORE operation
  try {
    // 3. Perform operation
  } catch (err: unknown) {
    error.value = getErrorMessage(err)  // 4. Store error message
    throw err                           // 5. MUST re-throw — callers need to know about failures
  } finally {
    loading.value = false   // 6. ALWAYS clear loading in finally (not in try or catch)
  }
}
```

**Common mistakes to avoid:**

```typescript
// ❌ WRONG — missing re-throw, caller won't know about the error
catch (err: unknown) {
  error.value = getErrorMessage(err)
  // Missing: throw err
}

// ❌ WRONG — loading cleared in try instead of finally
try {
  const result = await service.fetch()
  loading.value = false  // WRONG PLACE — won't run if error thrown
}

// ❌ WRONG — error not cleared before operation
async function fetchAll() {
  loading.value = true
  // Missing: error.value = null
  try { ... }
}
```

## Persistence (Auth Store)

The auth store uses `pinia-plugin-persistedstate` with split storage:

```ts
export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<IUser | null>(null)
    const token = ref<string | null>(null)
    const isAuthenticated = computed(() => !!token.value)
    // ...
  },
  {
    persist: [
      { pick: ['token'], storage: sessionStorage },  // Token in sessionStorage
      { pick: ['user'], storage: localStorage },      // User profile in localStorage
    ],
  },
)
```

## Response Handling (No Envelope)

The backend returns direct data — there is NO response envelope. Store actions must handle the raw response:

```typescript
// ✅ CORRECT — service returns IEntity directly
const created = await entityService.createEntity(data)
items.value.unshift(created)

// ❌ WRONG — no envelope exists, this will fail
const { data } = await entityService.createEntity(data)
```

## Cross-Store Access

Stores can access other stores inside actions (not at the top level):

```ts
// Inside productStore.create()
async function create(product: IProduct) {
  const authStore = useAuthStore()  // Access inside the function
  const creatorId = authStore.user?._id
  // ...
}
```

## Multiple Stores in One File

The financial domain groups related stores in a single file (`src/stores/financialStore.ts`):

```ts
export const useIncomeStore = defineStore('income', () => { /* ... */ })
export const useExpenseStore = defineStore('expense', () => { /* ... */ })
export const useSavingsStore = defineStore('savings', () => { /* ... */ })
export const useDebtStore = defineStore('debt', () => { /* ... */ })
export const useFinancialGoalStore = defineStore('financialGoal', () => { /* ... */ })
export const useFinancialMetricsStore = defineStore('financialMetrics', () => { /* ... */ })
```

Each store still follows the standard pattern. Group related stores when they share the same domain.

## Existing Stores

| Store                      | ID                 | File                    |
| -------------------------- | ------------------ | ----------------------- |
| `useAuthStore`             | `auth`             | `authStore.ts`          |
| `useProductStore`          | `product`          | `productStore.ts`       |
| `useOrderStore`            | `order`            | `orderStore.ts`         |
| `useBundleStore`           | `bundle`           | `bundleStore.ts`        |
| `usePromoStore`            | `promo`            | `promoStore.ts`         |
| `useMessageStore`          | `message`          | `messageStore.ts`       |
| `useIncomeStore`           | `income`           | `financialStore.ts`     |
| `useExpenseStore`          | `expense`          | `financialStore.ts`     |
| `useSavingsStore`          | `savings`          | `financialStore.ts`     |
| `useDebtStore`             | `debt`             | `financialStore.ts`     |
| `useFinancialGoalStore`    | `financialGoal`    | `financialStore.ts`     |
| `useFinancialMetricsStore` | `financialMetrics` | `financialStore.ts`     |
