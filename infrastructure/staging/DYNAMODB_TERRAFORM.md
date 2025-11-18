# DynamoDB Terraform Configuration - Enterprise Setup

This document describes the enterprise-grade Terraform configuration for managing DynamoDB resources in the Twitter backend project.

## Overview

The DynamoDB infrastructure is managed using Terraform with modular design, following AWS best practices for security, scalability, and cost optimization.

## Architecture

```
infrastructure/staging/
├── main.tf                          # Main configuration with DynamoDB module
├── variables.tf                     # Input variables
├── output.tf                        # Output values
├── terraform.tfvars.example         # Example configuration
└── modules/
    └── dynamodb/
        ├── main.tf                  # DynamoDB table resources
        ├── variables.tf             # Module variables
        ├── outputs.tf               # Module outputs
        ├── iam.tf                   # IAM policies for DynamoDB access
        └── README.md                # Module documentation
```

## Features

### 1. **Enterprise-Grade Table Configuration**
- Configurable billing modes (On-Demand or Provisioned)
- Auto-scaling for provisioned capacity
- DynamoDB Streams for change data capture
- Point-in-Time Recovery (PITR) for backups
- TTL for automatic data expiration
- Server-side encryption with AWS KMS

### 2. **IAM Security**
- Separate policies for full access and read-only access
- Least-privilege access patterns
- EC2 instance role integration
- Resource-based access control

### 3. **Monitoring & Alerting**
- CloudWatch alarms for throttling events
- User error tracking
- System error monitoring
- Capacity utilization alerts
- Optional Contributor Insights

### 4. **Cost Optimization**
- On-demand billing for variable workloads
- TTL for automatic cleanup
- Configurable capacity settings
- Resource tagging for cost allocation

## Quick Start

### Step 1: Copy Example Configuration

```bash
cd infrastructure/staging
cp terraform.tfvars.example terraform.tfvars
```

### Step 2: Edit Configuration

Edit `terraform.tfvars` with your values:

```hcl
aws_region = "us-east-1"
ami_id     = "ami-xxxxx"
key_name   = "your-key-pair"

# DynamoDB settings
dynamodb_notifications_table_name = "staging-user-notifications"
dynamodb_billing_mode              = "PAY_PER_REQUEST"
dynamodb_stream_enabled            = true
dynamodb_ttl_enabled               = true
```

### Step 3: Initialize Terraform

```bash
terraform init
```

### Step 4: Plan Changes

```bash
terraform plan
```

### Step 5: Apply Configuration

```bash
terraform apply
```

## Configuration Options

### Billing Modes

#### On-Demand (Recommended for Staging)

```hcl
dynamodb_billing_mode = "PAY_PER_REQUEST"
```

**Benefits:**
- No capacity planning needed
- Pay only for actual usage
- Automatic scaling
- No throttling (within service limits)

**When to Use:**
- Variable/unpredictable traffic
- Development/staging environments
- New applications

#### Provisioned Capacity (For Predictable Workloads)

```hcl
dynamodb_billing_mode = "PROVISIONED"
```

**Benefits:**
- Lower cost for predictable traffic
- Reserved capacity guarantees
- Can enable auto-scaling

**When to Use:**
- Steady, predictable traffic patterns
- High-volume applications with consistent load

### DynamoDB Streams

Enable streams for real-time processing:

```hcl
dynamodb_stream_enabled   = true
dynamodb_stream_view_type = "NEW_AND_OLD_IMAGES"
```

**Stream View Types:**
- `KEYS_ONLY`: Only key attributes
- `NEW_IMAGE`: Entire item after change
- `OLD_IMAGE`: Entire item before change
- `NEW_AND_OLD_IMAGES`: Both old and new items

**Use Cases:**
- Lambda triggers for real-time processing
- Cross-region replication
- Audit trails
- Real-time notifications via WebSockets

### Backup & Recovery

#### Point-in-Time Recovery (PITR)

```hcl
dynamodb_pitr_enabled = true
```

- Continuous backups for last 35 days
- Restore to any point in time
- **Recommended for production**

#### Prevent Accidental Deletion

```hcl
dynamodb_prevent_destroy = true
```

- Terraform will block table deletion
- **Critical for production tables**

### TTL (Time To Live)

```hcl
dynamodb_ttl_enabled        = true
dynamodb_ttl_attribute_name = "ttl"
```

- Automatically delete expired items
- Free feature (no additional cost)
- Reduces storage costs
- Background process (may take 48 hours)

**In your application:**
```javascript
// Set TTL to 90 days from now
const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
```

## IAM Integration

The module creates IAM policies that are automatically attached to your EC2 instance role.

### Policies Created

1. **Full Access Policy**: Read/write access to DynamoDB table
2. **Read-Only Policy**: Read-only access for analytics

### Access from EC2

Your EC2 instance automatically has access to DynamoDB:

```javascript
// No credentials needed - uses IAM role
const client = new DynamoDBClient({
  region: 'us-east-1'
});
```

### Manual Policy Attachment (Optional)

```hcl
resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_function.name
  policy_arn = module.dynamodb.dynamodb_access_policy_arn
}
```

## Monitoring

### CloudWatch Alarms

Enable alarms to monitor table health:

```hcl
dynamodb_enable_alarms = true
```

**Alarms Created:**
- Read throttle events
- Write throttle events
- User errors (client-side)
- System errors (server-side)

### Key Metrics to Monitor

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `ReadThrottleEvents` | Read requests exceeding capacity | > 10 |
| `WriteThrottleEvents` | Write requests exceeding capacity | > 10 |
| `UserErrors` | Client-side errors (validation, auth) | > 50 |
| `SystemErrors` | Server-side errors | > 5 |
| `ConsumedReadCapacityUnits` | Actual read consumption | 80% of provisioned |
| `ConsumedWriteCapacityUnits` | Actual write consumption | 80% of provisioned |

### CloudWatch Dashboard

View metrics in AWS Console:
1. Go to CloudWatch
2. Select "Dashboards"
3. Filter by table name: `staging-user-notifications`

## Cost Estimation

### Staging Environment (On-Demand)

**Assumptions:**
- 10,000 users
- 50 notifications per user per day
- 90-day retention (TTL)

**Monthly Costs:**
- **Writes**: 500K/day × 30 = 15M/month
  - Cost: 15M × $1.25/million = **$18.75**
- **Reads**: 100K/day × 30 = 3M/month
  - Cost: 3M × $0.25/million = **$0.75**
- **Storage**: ~2GB
  - Cost: 2GB × $0.25/GB = **$0.50**

**Total: ~$20/month**

### Production Environment (1M users)

- **Writes**: 50M/day × 30 = 1.5B/month → **$1,875**
- **Reads**: 10M/day × 30 = 300M/month → **$75**
- **Storage**: ~50GB → **$12.50**

**Total: ~$1,962.50/month**

## Best Practices

### 1. **Use On-Demand for Variable Workloads**
```hcl
dynamodb_billing_mode = "PAY_PER_REQUEST"
```

### 2. **Enable PITR in Production**
```hcl
dynamodb_pitr_enabled = true  # Production only
```

### 3. **Use TTL for Time-Series Data**
```hcl
dynamodb_ttl_enabled = true
```

### 4. **Enable Streams for Real-Time Processing**
```hcl
dynamodb_stream_enabled = true
```

### 5. **Tag All Resources**
```hcl
common_tags = {
  Project     = "Twitter Backend"
  Environment = "staging"
  ManagedBy   = "Terraform"
  CostCenter  = "Engineering"
}
```

### 6. **Protect Production Tables**
```hcl
dynamodb_prevent_destroy = true  # Production only
```

### 7. **Monitor with CloudWatch Alarms**
```hcl
dynamodb_enable_alarms = true
```

## Environment Differences

### Staging Configuration

```hcl
dynamodb_billing_mode    = "PAY_PER_REQUEST"
dynamodb_pitr_enabled    = false
dynamodb_prevent_destroy = false
dynamodb_enable_alarms   = false
```

### Production Configuration

```hcl
dynamodb_billing_mode    = "PAY_PER_REQUEST"
dynamodb_pitr_enabled    = true
dynamodb_prevent_destroy = true
dynamodb_enable_alarms   = true
```

## Terraform Commands

### Initialize

```bash
terraform init
```

### Validate Configuration

```bash
terraform validate
```

### Format Code

```bash
terraform fmt -recursive
```

### Plan Changes

```bash
terraform plan -out=tfplan
```

### Apply Changes

```bash
terraform apply tfplan
```

### Show Outputs

```bash
terraform output
```

### Import Existing Table

If you have an existing DynamoDB table:

```bash
terraform import module.dynamodb.aws_dynamodb_table.notifications your-table-name
```

### Destroy Resources (Staging Only)

```bash
terraform destroy
```

## Troubleshooting

### Error: Table Already Exists

**Problem:** Table already exists but not in Terraform state

**Solution:**
```bash
terraform import module.dynamodb.aws_dynamodb_table.notifications staging-user-notifications
```

### Error: Access Denied

**Problem:** IAM permissions missing

**Solution:**
1. Check your AWS credentials
2. Ensure your IAM user/role has DynamoDB permissions
3. Required permissions: `dynamodb:CreateTable`, `dynamodb:DescribeTable`, etc.

### Error: Module Not Found

**Problem:** DynamoDB module not found

**Solution:**
```bash
terraform init
```

### High Costs

**Problem:** Unexpected high costs

**Solutions:**
1. Check for scan operations (use Query instead)
2. Verify TTL is deleting old items
3. Review CloudWatch metrics for hot keys
4. Consider switching to provisioned mode

## Security Considerations

### 1. **Encryption**
- Encryption at rest enabled by default
- Uses AWS-managed keys (free)
- Can use custom KMS keys for compliance

### 2. **IAM Policies**
- Least-privilege access
- Separate read/write policies
- Resource-level permissions

### 3. **VPC Endpoints (Optional)**
```hcl
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.staging_vpc.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
}
```

### 4. **Audit Logging**
- Enable CloudTrail for API call logging
- Monitor with CloudWatch Logs

## Outputs

After applying, Terraform provides these outputs:

```bash
terraform output

# Example output:
dynamodb_notifications_table_name = "staging-user-notifications"
dynamodb_notifications_table_arn  = "arn:aws:dynamodb:us-east-1:123456789:table/staging-user-notifications"
dynamodb_notifications_stream_arn = "arn:aws:dynamodb:us-east-1:123456789:table/staging-user-notifications/stream/..."
dynamodb_access_policy_arn        = "arn:aws:iam::123456789:policy/staging-dynamodb-notifications-access"
```

## Next Steps

1. **Apply Terraform Configuration**
   ```bash
   terraform apply
   ```

2. **Update Application Environment Variables**
   ```bash
   DYNAMODB_NOTIFICATIONS_TABLE=staging-user-notifications
   AWS_REGION=us-east-1
   ```

3. **Test DynamoDB Access**
   ```bash
   npm run dynamodb:create-tables
   ```

4. **Monitor in CloudWatch**
   - View metrics and alarms
   - Set up dashboards

5. **Set Up Production Environment**
   - Copy to `infrastructure/production/`
   - Update variables for production
   - Enable PITR and alarms

## Resources

- [Terraform AWS Provider - DynamoDB](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dynamodb_table)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Module README](./modules/dynamodb/README.md)

## Support

For issues or questions:
1. Check the module README: `modules/dynamodb/README.md`
2. Review Terraform documentation
3. Check AWS DynamoDB documentation
