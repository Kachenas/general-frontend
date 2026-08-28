# Skill: Styling (Tailwind CSS)

## Framework

- **Tailwind CSS 4** — utility-first, all styling via class attributes
- **Headless UI** (`@headlessui/vue`) — unstyled accessible primitives
- **No `<style>` blocks** unless absolutely necessary (e.g., third-party component overrides)
- **`cn()` utility** — conditional class merging via `clsx` + `tailwind-merge`
- **Prettier plugin** — `prettier-plugin-tailwindcss` for automatic class sorting

## Tailwind Configuration

### `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff7043',
          50: '#fff5f0',
          100: '#ffe8db',
          200: '#ffd0b5',
          300: '#ffb088',
          400: '#ff9a76',
          500: '#ff7043',
          600: '#e65a2d',
          700: '#bf4520',
          800: '#993718',
          900: '#7a2d14',
        },
        surface: '#fffcfa',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
```

### `src/assets/main.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }
}

@layer components {
  /* Glassmorphism utility */
  .glass {
    @apply border border-white/50 bg-white/60 backdrop-blur-xl;
  }

  .glass-dark {
    @apply border border-white/30 bg-white/40 backdrop-blur-lg;
  }
}
```

## Design System

### Color Palette

| Token              | Tailwind Class           | Hex       | Usage                     |
| ------------------ | ------------------------ | --------- | ------------------------- |
| Primary            | `bg-primary`             | `#ff7043` | Buttons, accents, links   |
| Primary light      | `bg-primary-400`         | `#ff9a76` | Gradient start, hover     |
| Primary gradient   | `from-primary-400 to-primary` | —    | CTA buttons, logos        |
| Surface            | `bg-surface`             | `#fffcfa` | Page backgrounds          |
| Text primary       | `text-gray-900`          | —         | Headings, body            |
| Text secondary     | `text-gray-600`          | —         | Subtitles, nav links      |
| Text muted         | `text-gray-400`          | —         | Placeholders, captions    |
| Error              | `text-red-500`           | —         | Error messages            |
| Success            | `text-green-600`         | —         | Success states            |
| Warning            | `text-amber-500`         | —         | Warnings                  |

### Typography

```html
<!-- Page title -->
<h1 class="text-2xl font-bold text-gray-900">Title</h1>

<!-- Section heading -->
<h2 class="text-xl font-semibold text-gray-800">Section</h2>

<!-- Body text -->
<p class="text-sm text-gray-600">Body text</p>

<!-- Caption / label -->
<label class="text-xs font-medium uppercase tracking-wider text-gray-500">Label</label>

<!-- Muted helper -->
<p class="text-xs text-gray-400">Helper text</p>
```

### Glassmorphism

The design uses glassmorphism throughout — translucent panels with backdrop blur:

```html
<!-- Glass header -->
<header class="fixed inset-x-0 top-0 z-50 glass">
  ...
</header>

<!-- Glass sidebar -->
<aside class="fixed bottom-0 left-0 top-16 w-64 glass">
  ...
</aside>

<!-- Glass card -->
<div class="rounded-2xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
  ...
</div>
```

### Animated Background Circles

Decorative blurred circles on layout backgrounds:

```html
<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50/50 to-amber-100">
  <div class="animate-float absolute left-[5%] top-[10%] h-56 w-56 rounded-full bg-primary-300/20 blur-3xl" />
  <div class="animate-float-delayed absolute bottom-[20%] right-[10%] h-44 w-44 rounded-full bg-primary-200/25 blur-3xl" />
  <div class="animate-float-slow absolute left-[30%] top-[50%] h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
</div>
```

Add float keyframes in `tailwind.config.ts`:

```ts
keyframes: {
  float: {
    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
    '25%': { transform: 'translate(20px, -30px) scale(1.05)' },
    '50%': { transform: 'translate(-15px, 15px) scale(0.95)' },
    '75%': { transform: 'translate(10px, -20px) scale(1.02)' },
  },
},
animation: {
  float: 'float 18s ease-in-out infinite',
  'float-delayed': 'float 22s ease-in-out -6s infinite',
  'float-slow': 'float 20s ease-in-out -12s infinite',
},
```

## Class Merging Utility

Use `cn()` for conditional and merged Tailwind classes:

```ts
// src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Usage in components:

```vue
<button
  :class="cn(
    'rounded-lg px-4 py-2 font-medium transition-all',
    variant === 'primary' && 'bg-primary text-white shadow-md hover:shadow-lg',
    variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
    disabled && 'cursor-not-allowed opacity-50',
  )"
>
```

## Common Component Patterns

### Cards

```html
<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
  <h3 class="text-lg font-semibold text-gray-900">Card Title</h3>
  <p class="mt-2 text-sm text-gray-600">Card content</p>
</div>
```

### Buttons

```html
<!-- Primary gradient -->
<button class="rounded-lg bg-gradient-to-r from-primary-400 to-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
  Save
</button>

<!-- Ghost / outlined -->
<button class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-primary hover:text-primary">
  Cancel
</button>

<!-- Danger -->
<button class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
  Delete
</button>
```

### Form Inputs

```html
<!-- Text input -->
<input
  type="text"
  class="w-full rounded-xl border border-gray-200 bg-orange-50/30 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
  placeholder="Enter value"
/>

<!-- Select -->
<select class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
  <option>Option 1</option>
</select>
```

### Status Badges

```html
<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
  completed
</span>
<span class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
  pending
</span>
<span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
  failed
</span>
```

### Loading Spinner

```html
<svg class="h-5 w-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>
```

## Responsive Design

Use Tailwind's responsive prefixes:

```html
<!-- Mobile-first grid -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

<!-- Hidden on mobile -->
<nav class="hidden md:flex items-center gap-4">

<!-- Mobile-only hamburger -->
<button class="md:hidden">

<!-- Responsive text -->
<h1 class="text-xl md:text-2xl lg:text-3xl font-bold">

<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8">
```

## Transitions

Use Vue's `<Transition>` with Tailwind classes:

```vue
<Transition
  enter-active-class="duration-300 ease-out"
  enter-from-class="opacity-0 -translate-y-2"
  enter-to-class="opacity-100 translate-y-0"
  leave-active-class="duration-200 ease-in"
  leave-from-class="opacity-100 translate-y-0"
  leave-to-class="opacity-0 -translate-y-2"
>
  <div v-if="show">...</div>
</Transition>
```

Or use Headless UI's `<TransitionRoot>` / `<TransitionChild>` for dialog/menu animations.

## Dark Mode (Optional)

If dark mode is needed, use Tailwind's `dark:` prefix:

```html
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
```

Configure in `tailwind.config.ts`:
```ts
darkMode: 'class', // or 'media'
```

## Avoiding `<style>` Blocks

- **Prefer Tailwind classes** for all styling
- Use `<style>` only for:
  - Third-party component overrides (Quill editor, etc.)
  - Complex CSS animations that can't be expressed as Tailwind keyframes
  - CSS that targets dynamically injected HTML (e.g., `v-html` content)

When a `<style>` block is truly needed, keep it scoped and minimal:

```vue
<style scoped>
/* Only for Quill editor rendered HTML */
:deep(.ql-editor) {
  @apply text-base leading-relaxed text-gray-700;
}
:deep(.ql-editor p) {
  @apply mb-3;
}
</style>
```

## Prettier Class Sorting

`prettier-plugin-tailwindcss` automatically sorts Tailwind classes in the recommended order. No manual sorting needed — just run `npm run format`.
