# DynamoDB Terraform Module

Enterprise-grade Terraform module for managing DynamoDB tables with best practices.

## Features

- **On-Demand or Provisioned Billing**: Choose between pay-per-request or provisioned capacity
- **Auto-Scaling**: Automatic scaling for provisioned capacity mode
- **DynamoDB Streams**: Enable change data capture for real-time processing
- **Point-in-Time Recovery**: Continuous backups for disaster recovery
- **TTL (Time To Live)**: Automatic deletion of expired items
- **Server-Side Encryption**: Encrypted at rest using AWS KMS
- **CloudWatch Alarms**: Monitoring for throttling, errors, and capacity
- **IAM Policies**: Pre-configured policies for full access and read-only access
- **Contributor Insights**: Detailed access pattern analysis
- **Tags**: Consistent tagging for resource management

## Usage

### Basic Usage (On-Demand)

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  environment               = "staging"
  notifications_table_name  = "staging-user-notifications"
  billing_mode              = "PAY_PER_REQUEST"

  common_tags = {
    Project   = "Twitter Backend"
    ManagedBy = "Terraform"
  }
}
```

### Provisioned Capacity with Auto-Scaling

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  environment               = "production"
  notifications_table_name  = "prod-user-notifications"
  billing_mode              = "PROVISIONED"

  # Initial capacity
  read_capacity  = 10
  write_capacity = 10

  # Enable auto-scaling
  enable_autoscaling             = true
  autoscaling_read_max_capacity  = 100
  autoscaling_write_max_capacity = 100
  autoscaling_read_target_value  = 70
  autoscaling_write_target_value = 70

  common_tags = {
    Project     = "Twitter Backend"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
```

### With CloudWatch Alarms

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  environment               = "production"
  notifications_table_name  = "prod-user-notifications"

  # Enable monitoring
  enable_cloudwatch_alarms = true
  alarm_sns_topic_arn      = aws_sns_topic.alerts.arn

  # Alarm thresholds
  read_throttle_alarm_threshold  = 10
  write_throttle_alarm_threshold = 10
  user_errors_alarm_threshold    = 50
  system_errors_alarm_threshold  = 5

  common_tags = {
    Project     = "Twitter Backend"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
```

### With Custom KMS Encryption

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  environment               = "production"
  notifications_table_name  = "prod-user-notifications"

  # Use custom KMS key
  kms_key_arn = aws_kms_key.dynamodb.arn

  common_tags = {
    Project     = "Twitter Backend"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name (e.g., staging, production) | `string` | n/a | yes |
| notifications_table_name | Name of the DynamoDB notifications table | `string` | `"user-notifications"` | no |
| billing_mode | DynamoDB billing mode: PAY_PER_REQUEST or PROVISIONED | `string` | `"PAY_PER_REQUEST"` | no |
| read_capacity | Read capacity units (PROVISIONED mode only) | `number` | `5` | no |
| write_capacity | Write capacity units (PROVISIONED mode only) | `number` | `5` | no |
| enable_autoscaling | Enable auto-scaling for PROVISIONED mode | `bool` | `false` | no |
| autoscaling_read_max_capacity | Maximum read capacity for auto-scaling | `number` | `100` | no |
| autoscaling_write_max_capacity | Maximum write capacity for auto-scaling | `number` | `100` | no |
| stream_enabled | Enable DynamoDB Streams | `bool` | `true` | no |
| stream_view_type | Stream view type | `string` | `"NEW_AND_OLD_IMAGES"` | no |
| ttl_enabled | Enable Time To Live (TTL) | `bool` | `true` | no |
| ttl_attribute_name | TTL attribute name | `string` | `"ttl"` | no |
| point_in_time_recovery_enabled | Enable Point-in-Time Recovery (PITR) | `bool` | `true` | no |
| prevent_destroy | Prevent accidental deletion | `bool` | `true` | no |
| kms_key_arn | ARN of KMS key for encryption | `string` | `null` | no |
| enable_type_index | Enable TypeIndex GSI | `bool` | `false` | no |
| enable_cloudwatch_alarms | Enable CloudWatch alarms | `bool` | `true` | no |
| alarm_sns_topic_arn | SNS topic ARN for alarm notifications | `string` | `""` | no |
| enable_contributor_insights | Enable Contributor Insights | `bool` | `false` | no |
| common_tags | Common tags to apply to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| notifications_table_name | Name of the DynamoDB notifications table |
| notifications_table_arn | ARN of the DynamoDB notifications table |
| notifications_table_stream_arn | ARN of the DynamoDB stream |
| dynamodb_access_policy_arn | ARN of the full access IAM policy |
| dynamodb_read_only_policy_arn | ARN of the read-only IAM policy |

## IAM Integration

Attach the generated IAM policies to your EC2 instance role or service role:

```hcl
# Attach full access policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_dynamodb_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = module.dynamodb.dynamodb_access_policy_arn
}
```

## Data Model

### Notifications Table

- **Partition Key (PK)**: `USER#<userId>` - Groups notifications by user
- **Sort Key (SK)**: `NOTIF#<timestamp>#<notifId>` - Chronological sorting

### Access Patterns

1. **Get all notifications for a user**: Query PK = "USER#123"
2. **Get recent notifications**: Query PK = "USER#123" with limit
3. **Get single notification**: GetItem with PK and SK

## Best Practices

1. **Use On-Demand Billing**: For variable workloads, use `PAY_PER_REQUEST` mode
2. **Enable Point-in-Time Recovery**: Always enable PITR for production tables
3. **Set up CloudWatch Alarms**: Monitor throttling and errors
4. **Use TTL**: Automatically delete old items to save costs
5. **Enable Streams**: For real-time processing and audit trails
6. **Tag Resources**: Use consistent tagging for cost allocation
7. **Prevent Destroy**: Set `prevent_destroy = true` for production tables

## Cost Optimization

1. **Use TTL**: Automatically delete expired items (free)
2. **On-Demand Billing**: Pay only for what you use
3. **Monitor with CloudWatch**: Identify hot keys and optimize access patterns
4. **Use Global Secondary Indexes Sparingly**: They double costs

## Security

1. **Encryption at Rest**: Enabled by default using AWS-managed keys
2. **IAM Policies**: Least-privilege access with separate read/write policies
3. **VPC Endpoints**: Use VPC endpoints for private access (configure separately)
4. **Resource-Based Policies**: Fine-grained access control per table

## Monitoring

### Key Metrics to Monitor

- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `ReadThrottleEvents`
- `WriteThrottleEvents`
- `UserErrors`
- `SystemErrors`

### CloudWatch Alarms

This module automatically creates alarms for:
- Read throttle events
- Write throttle events
- User errors
- System errors

## Disaster Recovery

### Backups

1. **Point-in-Time Recovery**: Enabled by default, allows restore to any point in last 35 days
2. **On-Demand Backups**: Create manual backups using AWS Console or CLI

### Recovery Steps

```bash
# Restore from point-in-time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name prod-user-notifications \
  --target-table-name prod-user-notifications-restored \
  --restore-date-time 2025-01-01T12:00:00Z
```

## Development vs Production

### Development/Staging

```hcl
billing_mode                      = "PAY_PER_REQUEST"
point_in_time_recovery_enabled    = false
prevent_destroy                   = false
enable_cloudwatch_alarms          = false
```

### Production

```hcl
billing_mode                      = "PAY_PER_REQUEST"  # or PROVISIONED with auto-scaling
point_in_time_recovery_enabled    = true
prevent_destroy                   = true
enable_cloudwatch_alarms          = true
alarm_sns_topic_arn               = aws_sns_topic.alerts.arn
```

## Troubleshooting

### Table Already Exists Error

If the table already exists and was not created by Terraform:

```bash
# Import existing table
terraform import module.dynamodb.aws_dynamodb_table.notifications your-table-name
```

### Throttling Issues

1. Switch to On-Demand billing mode
2. Enable auto-scaling for Provisioned mode
3. Review access patterns and optimize queries

### High Costs

1. Check for scan operations (use Query instead)
2. Verify TTL is deleting old items
3. Review CloudWatch metrics for hot keys

## Additional Resources

- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Terraform AWS Provider - DynamoDB](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dynamodb_table)
