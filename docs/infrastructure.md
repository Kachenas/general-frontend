# Infrastructure

AWS infrastructure for the Vue 3 frontend, managed with Terraform.

## Overview

The frontend is a Vue 3 + Vite single-page application deployed to **AWS S3 + CloudFront**. GitHub Actions deploy workflows use **OIDC** to assume an IAM role — no static AWS credentials are stored in GitHub.

**Architecture:**

```
GitHub Actions (OIDC) → IAM Role → S3 (static files) ← CloudFront (CDN) ← Users
```

**Terraform manages:**

| Resource | Purpose |
|---|---|
| GitHub OIDC Provider | Federated identity for GitHub Actions |
| IAM Role + Policies | Scoped permissions for deploy workflows |
| S3 Bucket | Static site storage (public access blocked) |
| CloudFront Distribution | CDN with OAC, HTTPS, SPA routing |
| CloudFront OAC | Secure S3 access (replaces legacy OAI) |
| Secrets Manager Secret | Stores `api_base_url` for CI/CD |

## Prerequisites

1. **AWS CLI** configured with admin credentials (for bootstrapping only)
2. **Terraform** >= 1.5 installed locally
3. **GitHub CLI** (`gh`) for setting repository variables
4. An AWS account with permissions to create IAM, S3, CloudFront, and Secrets Manager resources

## GitHub Variables vs Secrets

This project uses GitHub **environment variables** (`vars.*`) for most configuration and **secrets** (`secrets.*`) only for sensitive values.

| Type | Syntax | Use for |
|---|---|---|
| Environment variables | `${{ vars.NAME }}` | Region, bucket names, role ARNs, API URLs |
| Secrets | `${{ secrets.NAME }}` | Sensitive tokens, distribution IDs |

Variables are scoped to a **GitHub environment** (e.g. `staging`, `prod`). The workflow job must declare `environment: <name>` to access them.

## Remote State Bootstrap

Before running Terraform, create the S3 bucket and DynamoDB table for remote state. This is a one-time setup per AWS account.

```bash
# Create state bucket
aws s3api create-bucket \
  --bucket YOUR-terraform-state-bucket \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

aws s3api put-bucket-versioning \
  --bucket YOUR-terraform-state-bucket \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket YOUR-terraform-state-bucket \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block \
  --bucket YOUR-terraform-state-bucket \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create lock table
aws dynamodb create-table \
  --table-name YOUR-terraform-lock-table \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

> **Note:** For regions other than `us-east-1`, the `--create-bucket-configuration LocationConstraint=<region>` flag is required when creating S3 buckets.

## Init / Plan / Apply

All commands run from the `terraform/` directory.

### Initialize (per environment)

```bash
# Staging
terraform init \
  -backend-config="bucket=YOUR-terraform-state-bucket" \
  -backend-config="key=frontend/staging/terraform.tfstate" \
  -backend-config="region=ap-southeast-1" \
  -backend-config="dynamodb_table=YOUR-terraform-lock-table" \
  -backend-config="encrypt=true"

# Production (use -reconfigure to switch environments)
terraform init -reconfigure \
  -backend-config="bucket=YOUR-terraform-state-bucket" \
  -backend-config="key=frontend/prod/terraform.tfstate" \
  -backend-config="region=ap-southeast-1" \
  -backend-config="dynamodb_table=YOUR-terraform-lock-table" \
  -backend-config="encrypt=true"
```

### Plan

```bash
terraform plan -var-file=staging.tfvars
terraform plan -var-file=prod.tfvars
```

### Apply

```bash
terraform apply -var-file=staging.tfvars
terraform apply -var-file=prod.tfvars
```

## Resources Created

After `terraform apply`, these resources exist in your AWS account:

| Resource | Name Pattern |
|---|---|
| IAM OIDC Provider | `token.actions.githubusercontent.com` |
| IAM Role | `frontend-{env}-github-actions` |
| S3 Bucket | Value of `bucket_name` variable |
| CloudFront Distribution | `frontend-{env}` (comment) |
| CloudFront OAC | `frontend-{env}-oac` |
| Secrets Manager Secret | `frontend/{env}/api-base-url` |

## How OIDC Works

1. GitHub Actions workflow requests an OIDC token from GitHub's token service
2. The workflow calls `aws-actions/configure-aws-credentials` with `role-to-assume`
3. AWS STS validates the token against the registered OIDC provider
4. The trust policy on the IAM role verifies the `sub` claim matches the expected `repo:org/repo:ref:refs/heads/branch`
5. STS issues temporary credentials scoped to the role's policies
6. The workflow uses these credentials for S3 sync and CloudFront invalidation

No long-lived AWS keys are stored in GitHub — credentials are ephemeral and scoped.

### OIDC Sub Claim Format

When a workflow uses a GitHub **environment**, the `sub` claim format changes:

| Workflow config | `sub` claim format |
|---|---|
| No `environment:` | `repo:Kachenas/general-frontend:ref:refs/heads/staging` |
| With `environment: staging` | `repo:Kachenas/general-frontend:environment:staging` |

The IAM trust policy `Condition` must match whichever format applies. See [docs/troubleshooting.md](troubleshooting.md) for debugging steps.

## Configuring GitHub Variables

After applying Terraform for each environment, set the GitHub environment variables referenced by the deploy workflows.

### Deploy workflow variables (from Terraform outputs)

```bash
cd terraform

# Initialize for staging
terraform init -backend-config="..." # see Init section

# Set staging variables (under the "staging" GitHub environment)
gh variable set STAGING_AWS_ROLE_ARN --body "$(terraform output -raw iam_role_arn)" --env staging
gh variable set STAGING_S3_BUCKET --body "$(terraform output -raw s3_bucket_name)" --env staging
gh variable set STAGING_CLOUDFRONT_DISTRIBUTION_ID --body "$(terraform output -raw cloudfront_distribution_id)" --env staging
gh variable set STAGING_API_BASE_URL --body "http://adventus-staging-alb-1170099516.ap-southeast-1.elb.amazonaws.com/api" --env staging
gh variable set AWS_REGION --body "ap-southeast-1" --env staging

# Switch to prod
terraform init -reconfigure -backend-config="..." # see Init section

# Set prod variables (under the "prod" GitHub environment)
gh variable set PROD_AWS_ROLE_ARN --body "$(terraform output -raw iam_role_arn)" --env prod
gh variable set PROD_S3_BUCKET --body "$(terraform output -raw s3_bucket_name)" --env prod
gh variable set PROD_CLOUDFRONT_DISTRIBUTION_ID --body "$(terraform output -raw cloudfront_distribution_id)" --env prod
gh variable set PROD_API_BASE_URL --body "https://api.example.com/api" --env prod
gh variable set AWS_REGION --body "ap-southeast-1" --env prod
```

### Terraform workflow secrets (set manually)

These are for the Terraform GitHub Actions workflows themselves:

```bash
gh secret set TF_STAGING_AWS_ROLE_ARN --body "arn:aws:iam::627290889286:role/YOUR-tf-staging-admin-role"
gh secret set TF_PROD_AWS_ROLE_ARN --body "arn:aws:iam::627290889286:role/YOUR-tf-prod-admin-role"
gh secret set TF_STATE_BUCKET --body "YOUR-terraform-state-bucket"
gh secret set TF_LOCK_TABLE --body "YOUR-terraform-lock-table"
```

> The `TF_*_AWS_ROLE_ARN` roles need admin-level permissions to create and manage IAM, S3, CloudFront, and Secrets Manager resources. These are separate from the deploy roles that Terraform creates.

## Deployment Flow

### First-time setup

1. Bootstrap remote state (S3 bucket + DynamoDB table)
2. Create Terraform admin IAM roles for staging and prod
3. Set `TF_*` GitHub secrets
4. Run `terraform apply -var-file=staging.tfvars`
5. Create GitHub environments (`staging`, `prod`) and set variables from Terraform outputs
6. Push to `staging` branch — deploy workflow runs automatically

### Ongoing deployments

```
Push to staging branch
  → GitHub Actions triggers deploy-staging.yml
  → Job loads "staging" environment variables
  → OIDC authenticates → assumes IAM role
  → npm ci → npm run build (with VITE_API_BASE_URL)
  → aws s3 sync dist/ → CloudFront invalidation
```

Production follows the same flow on the `production` branch with the `prod` environment.

## Terraform Workflows

Infrastructure changes can be managed from GitHub Actions without running Terraform locally.

### Running from GitHub Actions

1. Go to **Actions** tab in the GitHub repository
2. Select **Terraform — Staging** or **Terraform — Production**
3. Click **Run workflow**
4. Choose an action: `plan`, `apply`, or `destroy`

### Actions

| Action | Description |
|---|---|
| `plan` | Preview changes without applying (safe to run anytime) |
| `apply` | Apply changes to the environment (creates/updates resources) |
| `destroy` | Tear down all resources in the environment |

### Required secrets

| Secret | Purpose |
|---|---|
| `TF_STAGING_AWS_ROLE_ARN` | IAM role for managing staging infrastructure |
| `TF_PROD_AWS_ROLE_ARN` | IAM role for managing production infrastructure |
| `TF_STATE_BUCKET` | S3 bucket for Terraform remote state |
| `TF_LOCK_TABLE` | DynamoDB table for state locking |
| `AWS_REGION` | AWS region (shared, set as environment variable) |

## Teardown

To destroy all resources for an environment:

```bash
cd terraform

# Initialize for the target environment
terraform init -reconfigure -backend-config="..." # see Init section

# Destroy
terraform destroy -var-file=staging.tfvars   # or prod.tfvars
```

Or use the GitHub Actions workflow: run **Terraform — Staging** (or Production) with the `destroy` action.

> S3 bucket deletion may fail if it contains objects. Empty the bucket first:
> ```bash
> aws s3 rm s3://BUCKET_NAME --recursive
> ```
