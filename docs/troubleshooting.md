# Troubleshooting

Common issues encountered during setup and deployment, with solutions.

## Build Errors

### `Property 'env' does not exist on type 'ImportMeta'`

```
error TS2339: Property 'env' does not exist on type 'ImportMeta'.
```

**Cause:** The project is missing `src/env.d.ts`, which tells TypeScript about Vite's type extensions.

**Fix:** Create `src/env.d.ts`:

```ts
/// <reference types="vite/client" />
```

This provides types for `import.meta.env` and CSS module imports.

---

### `Cannot find module or type declarations for side-effect import of './assets/main.css'`

```
error TS2882: Cannot find module or type declarations for side-effect import of './assets/main.css'.
```

**Cause:** `noUncheckedSideEffectImports` is enabled in `tsconfig.app.json` and there is no type declaration for `.css` files.

**Fix:** Same as above — create `src/env.d.ts` with `/// <reference types="vite/client" />`. The Vite client types include declarations for CSS imports.

---

## GitHub Actions — AWS Credentials

### `Input required and not supplied: aws-region`

```
Error: Input required and not supplied: aws-region
```

**Cause:** The workflow references `vars.AWS_REGION` (or `secrets.AWS_REGION`) but the value resolves to empty.

Two common reasons:

**1. Variables stored as environment variables but referenced as secrets (or vice versa)**

GitHub has two separate stores:
- **Secrets** → accessed via `${{ secrets.NAME }}`
- **Variables** → accessed via `${{ vars.NAME }}`

Check which store your values are in and use the matching syntax.

**2. Variables are scoped to a GitHub environment but the job doesn't declare it**

If your variables are stored under a GitHub environment (e.g. `staging`), the job must declare `environment:`:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging  # Required to access environment-scoped vars
```

Without this line, all `vars.*` references resolve to empty strings.

---

### `Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity`

```
Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Cause:** The IAM role's trust policy does not match the OIDC token's `sub` claim.

**Key detail 1 — Numeric IDs in sub claim:** GitHub's OIDC tokens include numeric user/repo IDs in the `sub` claim:

```
# Expected (old format):
repo:Kachenas/general-frontend:environment:staging

# Actual (current format):
repo:Kachenas@34016103/general-frontend@1349557226:environment:staging
```

If your trust policy uses `repo:Kachenas/general-frontend:*`, it will NOT match `repo:Kachenas@34016103/general-frontend@1349557226:*`.

**Key detail 2 — Environment changes the suffix:** When a workflow job declares `environment: staging`, the `sub` claim suffix changes:

| Workflow config | `sub` claim suffix |
|---|---|
| No `environment:` | `:ref:refs/heads/staging` |
| With `environment: staging` | `:environment:staging` |

**Fix:** Update the IAM trust policy `Condition` to use the full sub claim prefix with numeric IDs:

```json
{
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:Kachenas@34016103/general-frontend@1349557226:*"
    }
  }
}
```

Using `:*` as a wildcard matches both environment and branch ref formats.

To find your numeric IDs, use the debug OIDC step below and look at the `sub` field.

**Debugging:** Add this step before the AWS credentials step to inspect the actual OIDC token claims:

```yaml
- name: Debug OIDC token
  run: |
    echo "Repo: ${{ github.repository }}"
    echo "Ref: ${{ github.ref }}"
    OIDC_TOKEN=$(curl -s -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
      "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com")
    echo "$OIDC_TOKEN" | jq -r '.value' | cut -d'.' -f2 | base64 -d 2>/dev/null | jq '{sub, aud, iss, repo, ref}'
```

Compare the `sub` value in the output against your IAM trust policy condition.

**Other causes:**
- The OIDC provider thumbprint is outdated (GitHub rotates certificates)
- The OIDC provider doesn't exist in the AWS account
- The IAM role ARN is incorrect

Verify the OIDC provider:

```bash
aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
```

---

## GitHub Actions — General

### `Node 20 is being deprecated`

```
Node 20 is being deprecated. This workflow is running with Node 24 by default.
```

**Cause:** GitHub Actions runners have moved to Node 24. Some older action versions still reference Node 20.

**Fix:** This is a warning, not an error. Update actions to their latest versions to suppress it:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: aws-actions/configure-aws-credentials@v4
```

If an action hasn't been updated yet, you can temporarily suppress the warning by setting the environment variable mentioned in the message, but updating is preferred.

---

## S3 / CloudFront

### CloudFront returns 403 for all routes

**Cause:** The S3 bucket policy doesn't grant access to the CloudFront distribution, or the OAC is not configured.

**Fix:** Ensure Terraform has been applied — it creates the OAC and bucket policy together. If the resources were created manually, verify:

1. The CloudFront distribution uses an **Origin Access Control** (not legacy OAI)
2. The S3 bucket policy allows `s3:GetObject` from `cloudfront.amazonaws.com` with a condition matching the distribution ARN
3. S3 static website hosting is **disabled** (OAC uses the REST API endpoint)

---

### SPA routes return 404 or 403

**Cause:** CloudFront is looking for a file matching the URL path (e.g. `/dashboard`) in S3, which doesn't exist.

**Fix:** CloudFront needs custom error responses to serve `index.html` for SPA routing. The Terraform config creates these automatically:

| Error Code | Response Code | Response Page |
|---|---|---|
| 403 | 200 | `/index.html` |
| 404 | 200 | `/index.html` |

Both 403 and 404 are needed because S3 returns 403 (not 404) when a key doesn't exist and public access is blocked.

---

## Terraform

### `Backend initialization required`

```
Error: Backend initialization required, please run "terraform init"
```

**Cause:** You need to run `terraform init` with backend config before any other command. This also happens when switching between environments.

**Fix:**

```bash
# First time or switching environments
terraform init -reconfigure \
  -backend-config="bucket=..." \
  -backend-config="key=frontend/<env>/terraform.tfstate" \
  -backend-config="region=ap-southeast-1" \
  -backend-config="dynamodb_table=..." \
  -backend-config="encrypt=true"
```

Use `-reconfigure` when switching between staging and prod to point at a different state file.
