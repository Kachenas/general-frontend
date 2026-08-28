output "iam_role_arn" {
  description = "IAM role ARN for GitHub Actions deploy workflow"
  value       = aws_iam_role.github_actions.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for static site hosting"
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "api_base_url_secret_arn" {
  description = "Secrets Manager ARN for the API base URL"
  value       = aws_secretsmanager_secret.api_base_url.arn
}
