# -------------------------
# IAM POLICY FOR DYNAMODB ACCESS
# -------------------------

# IAM policy document for DynamoDB access
data "aws_iam_policy_document" "dynamodb_access" {
  # Full access to notifications table
  statement {
    sid    = "DynamoDBTableAccess"
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem",
    ]
    resources = [
      aws_dynamodb_table.notifications.arn,
      "${aws_dynamodb_table.notifications.arn}/index/*",
    ]
  }

  # Access to DynamoDB Streams (for real-time processing)
  statement {
    sid    = "DynamoDBStreamAccess"
    effect = "Allow"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]
    resources = [
      aws_dynamodb_table.notifications.stream_arn,
    ]
  }

  # List tables permission (optional, for management operations)
  statement {
    sid    = "DynamoDBListTables"
    effect = "Allow"
    actions = [
      "dynamodb:ListTables",
    ]
    resources = ["*"]
  }
}

# Create IAM policy from the document
resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.environment}-dynamodb-notifications-access"
  path        = "/"
  description = "IAM policy for DynamoDB notifications table access"
  policy      = data.aws_iam_policy_document.dynamodb_access.json

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.environment}-dynamodb-notifications-access"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# -------------------------
# READ-ONLY POLICY (for analytics/reporting services)
# -------------------------

data "aws_iam_policy_document" "dynamodb_read_only" {
  statement {
    sid    = "DynamoDBReadOnlyAccess"
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.notifications.arn,
      "${aws_dynamodb_table.notifications.arn}/index/*",
    ]
  }
}

resource "aws_iam_policy" "dynamodb_read_only" {
  name        = "${var.environment}-dynamodb-notifications-read-only"
  path        = "/"
  description = "IAM read-only policy for DynamoDB notifications table"
  policy      = data.aws_iam_policy_document.dynamodb_read_only.json

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.environment}-dynamodb-notifications-read-only"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# -------------------------
# OUTPUTS
# -------------------------

output "dynamodb_access_policy_arn" {
  description = "ARN of the DynamoDB full access IAM policy"
  value       = aws_iam_policy.dynamodb_access.arn
}

output "dynamodb_read_only_policy_arn" {
  description = "ARN of the DynamoDB read-only IAM policy"
  value       = aws_iam_policy.dynamodb_read_only.arn
}
