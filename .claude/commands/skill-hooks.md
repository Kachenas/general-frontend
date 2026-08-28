# Skill: Git Hooks & Quality Gates

## Pre-commit Hook Setup

Install Husky and lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
npx lint-staged
```

### `lint-staged` config in `package.json`

```json
{
  "lint-staged": {
    "*.{ts,tsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

## Pre-push Hook (Type Check)

### `.husky/pre-push`

```bash
#!/usr/bin/env sh
echo "Running type check..."
npx vue-tsc --build --noEmit
```

## Custom Composable Name Validation

Add a script to verify all composables follow the `use*` pattern:

### `scripts/check-composables.sh`

```bash
#!/usr/bin/env sh
# Verify all files in src/composables/ export a use* function

EXIT_CODE=0

for file in src/composables/*.ts; do
  basename=$(basename "$file" .ts)

  # Skip index files
  if [ "$basename" = "index" ]; then
    continue
  fi

  # Check filename starts with 'use'
  if ! echo "$basename" | grep -q '^use'; then
    echo "ERROR: $file does not follow use* naming convention"
    EXIT_CODE=1
  fi

  # Check file exports a function matching its filename
  if ! grep -q "export function $basename" "$file"; then
    echo "WARNING: $file does not export a function named $basename"
  fi
done

exit $EXIT_CODE
```

Add to `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
npx lint-staged
sh scripts/check-composables.sh
```

## ESLint Custom Rules

In `eslint.config.ts`, add rules for Tailwind + Vue conventions:

```ts
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  skipFormatting,

  {
    rules: {
      // Vue rules
      'vue/component-name-in-template-always-multi-word': 'off',
      'vue/multi-word-component-names': 'off',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Enforce consistent naming
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
      ],
    },
  },
)
```

## CI Pipeline Example (GitHub Actions)

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main, staging]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Composable Naming Check
        run: sh scripts/check-composables.sh
```

## Summary of Quality Gates

| Gate                   | When          | What it checks                              |
| ---------------------- | ------------- | ------------------------------------------- |
| `lint-staged`          | Pre-commit    | ESLint + Prettier on staged files            |
| `check-composables.sh` | Pre-commit   | All composables follow `use*` pattern        |
| `vue-tsc`              | Pre-push / CI | Full TypeScript type checking                |
| `npm run build`        | CI            | Production build succeeds                    |
