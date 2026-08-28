# IAM role assumed by GitHub Actions deploy workflows via OIDC.

data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${var.github_oidc_sub}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "frontend-${var.environment}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json
}

# Policy: S3 sync (upload + delete objects)
data "aws_iam_policy_document" "s3_sync" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.site.arn,
      "${aws_s3_bucket.site.arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "s3_sync" {
  name   = "s3-sync"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.s3_sync.json
}

# Policy: CloudFront cache invalidation
data "aws_iam_policy_document" "cloudfront_invalidation" {
  statement {
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
    ]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "cloudfront_invalidation" {
  name   = "cloudfront-invalidation"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.cloudfront_invalidation.json
}

# Policy: Secrets Manager read (for API base URL)
data "aws_iam_policy_document" "secrets_read" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [aws_secretsmanager_secret.api_base_url.arn]
  }
}

resource "aws_iam_role_policy" "secrets_read" {
  name   = "secrets-read"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.secrets_read.json
}
