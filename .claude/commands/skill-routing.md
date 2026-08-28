# Skill: Routing

## Structure

Routes are defined in `src/router/routes.ts` and the router instance is created in `src/router/index.ts`.

## Layout-Based Route Architecture

Every route is wrapped in a layout component:

```ts
import type { RouteRecordRaw } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CheckOutLayout from '@/layouts/CheckOutLayout.vue'

export const routes: RouteRecordRaw[] = [
  // Public routes (DefaultLayout)
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', component: HomeView },
      { path: 'login', component: LoginView },
      { path: 'register', component: RegisterView },
    ],
  },
  // Authenticated routes (DashboardLayout)
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [{ path: '', component: DashboardView }],
    meta: { requiresAuth: true },
  },
  // 404 catch-all (lazy loaded)
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404View.vue'),
  },
]
```

## Three Layouts

| Layout              | Purpose                                | Routes Using It |
| ------------------- | -------------------------------------- | --------------- |
| `DefaultLayout`     | Public pages (header + footer)         | `/`, `/login`, `/register`, `/contact` |
| `DashboardLayout`   | Authenticated pages (sidebar + header) | `/dashboard`, `/orders`, `/products`, `/reports`, `/settings`, `/financial-tracker`, `/admin`, `/audit-logs`, `/messages` |
| `CheckOutLayout`    | Public checkout flow (header + footer) | `/checkout` |

## Adding a New Route

### Step 1: Create the View

```
src/views/NewFeatureView.vue
```

### Step 2: Import and Add Route

In `src/router/routes.ts`:

```ts
import NewFeatureView from '@/views/NewFeatureView.vue'

// Add to routes array:
{
  path: '/new-feature',
  component: DashboardLayout,  // or DefaultLayout for public
  children: [{ path: '', component: NewFeatureView }],
  meta: { requiresAuth: true },
}
```

### Step 3: Add Navigation Item (if authenticated route)

In `src/layouts/DashboardLayout.vue`, add to `allNavigationItems`:

```ts
const allNavigationItems = [
  // ... existing items
  { key: 'new-feature', path: '/new-feature', title: 'New Feature', icon: StarIcon },
]
```

## Route Meta Fields

| Meta Field               | Type    | Purpose                        |
| ------------------------ | ------- | ------------------------------ |
| `requiresAuth`           | boolean | Must be logged in              |
| `requiresAdmin`          | boolean | Must have `admin` role         |
| `requiresAdminOrPartner` | boolean | Must have `admin` or `partner` role |

## Global Navigation Guard

The `beforeEach` guard in `src/router/index.ts` handles:

1. **Token validation:** `authStore.checkAuth()` on every navigation
2. **Logout path:** `/logout` triggers `authStore.logout()` and redirects to `/`
3. **Auth redirect:** Logged-in users hitting `/login` or `/register` go to `/dashboard`
4. **Auth protection:** `requiresAuth` routes redirect unauthenticated users to `/login`
5. **Admin check:** `requiresAdmin` routes require `role === 'admin'`
6. **Admin/Partner check:** `requiresAdminOrPartner` allows both roles
7. **Navigation permissions:** Regular users are restricted to their `allowedNavigation` array

## Navigation Style

- **Path-based navigation** (no named routes):
  ```ts
  router.push('/dashboard')
  router.push('/login?reason=inactivity')
  ```
- **Router links in templates:**
  ```vue
  <router-link to="/dashboard">Dashboard</router-link>
  ```

## Lazy Loading

Currently only the 404 view is lazy-loaded:

```ts
component: () => import('@/views/404View.vue')
```

All other views are eagerly imported. If bundle size becomes a concern, convert to:

```ts
{
  path: '/feature',
  component: DashboardLayout,
  children: [{
    path: '',
    component: () => import('@/views/FeatureView.vue'),
  }],
  meta: { requiresAuth: true },
}
```
