# Staging Infrastructure - Terraform Configuration

Enterprise-grade Terraform configuration for the Twitter Backend staging environment.

## Overview

This directory contains Terraform configurations for managing AWS infrastructure including:
- VPC and networking
- EC2 instances
- ECR repositories
- **DynamoDB tables** (notifications system)
- IAM roles and policies
- Security groups
- Elastic IPs
- SES email templates

## Quick Start

```bash
# 1. Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# 2. Edit configuration
vim terraform.tfvars

# 3. Initialize Terraform
terraform init

# 4. Review changes
terraform plan

# 5. Apply configuration
terraform apply
```

## Directory Structure

```
infrastructure/staging/
├── main.tf                          # Main infrastructure configuration
├── variables.tf                     # Input variables
├── output.tf                        # Output values
├── terraform.tfvars.example         # Example configuration
├── user_data.sh                     # EC2 bootstrap script
│
├── modules/                         # Reusable modules
│   └── dynamodb/                    # DynamoDB module
│       ├── main.tf                  # Table and monitoring configuration
│       ├── variables.tf             # Module variables
│       ├── outputs.tf               # Module outputs
│       ├── iam.tf                   # IAM policies
│       └── README.md                # Module documentation
│
├── templates/                       # Configuration templates
│   └── email_confirmation/          # SES email templates
│
├── bootstrap/                       # Bootstrap resources
│   └── bootstrap.tf                 # S3 backend and state locking
│
└── docs/                           # Documentation
    ├── README.md                    # This file
    ├── DYNAMODB_TERRAFORM.md        # DynamoDB configuration guide
    ├── DEPLOYMENT_GUIDE.md          # Step-by-step deployment
    └── TERRAFORM_COMMANDS.md        # Command reference
```

## Resources Managed

### Networking
- **VPC**: `10.0.0.0/16` with DNS support
- **Internet Gateway**: Public internet access
- **Subnet**: `10.0.1.0/24` in `us-east-1a`
- **Route Table**: Routes to internet gateway
- **Security Group**: Configurable access rules
- **Network ACL**: Additional network layer security

### Compute
- **EC2 Instance**: Application server
- **Elastic IP**: Static public IP
- **IAM Instance Profile**: EC2 role with ECR and DynamoDB access

### Storage & Database
- **ECR Repository**: Docker image storage
- **DynamoDB Table**: User notifications (with streams, TTL, PITR)

### Security & Access
- **IAM Roles**: EC2 service role
- **IAM Policies**: DynamoDB access (full and read-only)
- **Security Groups**: Network access control

### Monitoring
- **CloudWatch Alarms**: DynamoDB throttling and errors (optional)
- **DynamoDB Streams**: Change data capture

## DynamoDB Configuration

### Features
✅ On-Demand or Provisioned billing
✅ Auto-scaling for provisioned capacity
✅ DynamoDB Streams for real-time processing
✅ Point-in-Time Recovery (PITR) for backups
✅ TTL for automatic data expiration
✅ Server-side encryption (KMS)
✅ CloudWatch monitoring and alarms
✅ IAM policies for secure access
✅ Contributor Insights (optional)

### Table Schema

**Table Name**: `staging-user-notifications`

| Key | Type | Description |
|-----|------|-------------|
| PK | Partition Key | `USER#<userId>` |
| SK | Sort Key | `NOTIF#<timestamp>#<notifId>` |

**Additional Attributes**:
- `notificationId`, `type`, `actorId`, `postId`, `read`, `createdAt`, `ttl`

## Configuration

### Essential Variables

Edit `terraform.tfvars`:

```hcl
# AWS
aws_region = "us-east-1"

# EC2
ami_id        = "ami-xxxxx"
instance_type = "t3.medium"
key_name      = "your-key-pair"

# DynamoDB
dynamodb_notifications_table_name = "staging-user-notifications"
dynamodb_billing_mode              = "PAY_PER_REQUEST"
dynamodb_stream_enabled            = true
dynamodb_ttl_enabled               = true
```

### Environment-Specific Settings

**Staging** (current):
```hcl
dynamodb_pitr_enabled    = false   # Save costs
dynamodb_prevent_destroy = false   # Allow easy cleanup
dynamodb_enable_alarms   = false   # Optional monitoring
```

**Production** (recommended):
```hcl
dynamodb_pitr_enabled    = true    # Enable backups
dynamodb_prevent_destroy = true    # Prevent deletion
dynamodb_enable_alarms   = true    # Monitor health
```

## Deployment

### Prerequisites
- AWS CLI configured
- Terraform >= 1.0 installed
- IAM permissions for DynamoDB, IAM, EC2, VPC

### Step-by-Step

1. **Initialize**
   ```bash
   terraform init
   ```

2. **Configure**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars
   ```

3. **Plan**
   ```bash
   terraform plan -out=tfplan
   ```

4. **Apply**
   ```bash
   terraform apply tfplan
   ```

5. **Verify**
   ```bash
   terraform output
   aws dynamodb describe-table --table-name staging-user-notifications
   ```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Outputs

After deployment, Terraform provides:

```bash
terraform output

# Infrastructure
public_ip                          = "x.x.x.x"
instance_id                        = "i-xxxxx"
ecr_repository_url                 = "xxxxx.dkr.ecr.us-east-1.amazonaws.com/nestjs-app"

# DynamoDB
dynamodb_notifications_table_name  = "staging-user-notifications"
dynamodb_notifications_table_arn   = "arn:aws:dynamodb:us-east-1:xxx:table/staging-user-notifications"
dynamodb_notifications_stream_arn  = "arn:aws:dynamodb:us-east-1:xxx:table/.../stream/..."
dynamodb_access_policy_arn         = "arn:aws:iam::xxx:policy/staging-dynamodb-notifications-access"
```

## Common Tasks

### Deploy DynamoDB Only

```bash
terraform apply -target=module.dynamodb
```

### Update DynamoDB Settings

```bash
# Edit terraform.tfvars
terraform plan -target=module.dynamodb
terraform apply -target=module.dynamodb
```

### Enable CloudWatch Alarms

```bash
# Set in terraform.tfvars:
dynamodb_enable_alarms = true

terraform apply -target=module.dynamodb
```

### Import Existing Table

```bash
terraform import module.dynamodb.aws_dynamodb_table.notifications staging-user-notifications
```

### View Specific Output

```bash
terraform output dynamodb_notifications_table_name
```

## Monitoring

### CloudWatch Metrics

Monitor in AWS Console:
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `ReadThrottleEvents`
- `WriteThrottleEvents`

### CLI Monitoring

```bash
# Table status
aws dynamodb describe-table --table-name staging-user-notifications

# Recent metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=staging-user-notifications \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Cost Optimization

### Current Setup (Staging)
- **Billing**: On-Demand (pay per request)
- **PITR**: Disabled (saves ~$0.20/GB/month)
- **Alarms**: Disabled (saves ~$0.10/alarm/month)
- **Estimated**: ~$20/month for light usage

### Tips
1. Use TTL to auto-delete old items
2. Monitor with CloudWatch to identify inefficiencies
3. Use Query instead of Scan operations
4. Consider Provisioned mode for predictable workloads

## Security

### IAM Policies
- EC2 instance has full DynamoDB access via IAM role
- Separate read-only policy available
- Least-privilege principle

### Encryption
- Server-side encryption enabled by default
- Uses AWS-managed keys (can use custom KMS keys)

### Network
- DynamoDB accessed via AWS private network
- Can add VPC endpoints for additional security

## Backup & Recovery

### Backups
- **PITR**: Disabled in staging (enable for production)
- **On-Demand Backups**: Available via AWS Console or CLI

### State Backups
```bash
# Manual backup
terraform state pull > backup-$(date +%Y%m%d).tfstate

# Restore
terraform state push backup-20250118.tfstate
```

## Troubleshooting

### Common Issues

1. **"Table already exists"**
   ```bash
   terraform import module.dynamodb.aws_dynamodb_table.notifications staging-user-notifications
   ```

2. **"Access denied"**
   - Check AWS credentials: `aws sts get-caller-identity`
   - Verify IAM permissions

3. **"Module not found"**
   ```bash
   terraform init -upgrade
   ```

4. **State locked**
   ```bash
   terraform force-unlock <lock-id>
   ```

## Documentation

- **[DYNAMODB_TERRAFORM.md](./DYNAMODB_TERRAFORM.md)** - Complete DynamoDB configuration guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[TERRAFORM_COMMANDS.md](./TERRAFORM_COMMANDS.md)** - Command reference
- **[modules/dynamodb/README.md](./modules/dynamodb/README.md)** - Module documentation

## Best Practices

✅ Always run `terraform plan` before `apply`
✅ Use `terraform.tfvars` for sensitive values (don't commit to git)
✅ Enable `prevent_destroy` for production tables
✅ Tag all resources consistently
✅ Use modules for reusable components
✅ Keep state in S3 with DynamoDB locking
✅ Enable PITR for production
✅ Monitor with CloudWatch alarms
✅ Use TTL for time-series data
✅ Document all changes

## Maintenance

### Regular Tasks
- [ ] Review CloudWatch metrics weekly
- [ ] Check for Terraform updates monthly
- [ ] Audit IAM policies quarterly
- [ ] Test backup/restore procedures quarterly
- [ ] Review and optimize costs monthly

### Updates
```bash
# Update Terraform providers
terraform init -upgrade

# Update modules
terraform get -update

# Format code
terraform fmt -recursive
```

## Migration to Production

1. Copy staging configuration:
   ```bash
   cp -r infrastructure/staging infrastructure/production
   ```

2. Update production settings:
   ```hcl
   dynamodb_notifications_table_name = "prod-user-notifications"
   dynamodb_pitr_enabled              = true
   dynamodb_prevent_destroy           = true
   dynamodb_enable_alarms             = true
   ```

3. Update backend configuration in `main.tf`:
   ```hcl
   backend "s3" {
     key = "production/terraform.tfstate"
   }
   ```

4. Deploy production:
   ```bash
   cd infrastructure/production
   terraform init
   terraform plan
   terraform apply
   ```

## Support

- **Terraform Issues**: https://github.com/hashicorp/terraform/issues
- **AWS Provider**: https://github.com/hashicorp/terraform-provider-aws
- **Module Documentation**: [modules/dynamodb/README.md](./modules/dynamodb/README.md)

## Version Information

- **Terraform**: >= 1.0
- **AWS Provider**: >= 5.0
- **Backend**: S3 + DynamoDB

## Contributors

Managed by: Infrastructure Team
Last Updated: 2025-01-18
Terraform Version: 1.x
