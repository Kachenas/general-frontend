variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "github_org_repo" {
  description = "GitHub org/repo (e.g. 'my-org/frontend')"
  type        = string
}

variable "github_oidc_sub" {
  description = "OIDC sub claim prefix including numeric IDs (e.g. 'repo:Org@123/repo@456'). Get this from the debug OIDC step in the workflow."
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to assume the deploy role"
  type        = string
}

variable "bucket_name" {
  description = "S3 bucket name for the static site"
  type        = string
}

variable "api_base_url" {
  description = "Backend API base URL injected at build time"
  type        = string
}

variable "custom_domain" {
  description = "Optional custom domain for CloudFront (e.g. 'app.example.com')"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the custom domain (required if custom_domain is set)"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}
