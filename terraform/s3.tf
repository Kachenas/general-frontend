# S3 bucket for static site assets (served via CloudFront OAC, not S3 website hosting).

resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy: allow CloudFront OAC to read objects
data "aws_iam_policy_document" "s3_cloudfront" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.s3_cloudfront.json
}

# Secrets Manager: store the API base URL for CI/CD reference
resource "aws_secretsmanager_secret" "api_base_url" {
  name        = "frontend/${var.environment}/api-base-url"
  description = "Backend API base URL for the ${var.environment} frontend build"
}

resource "aws_secretsmanager_secret_version" "api_base_url" {
  secret_id     = aws_secretsmanager_secret.api_base_url.id
  secret_string = var.api_base_url
}
