# DynamoDB Terraform Deployment Guide

Step-by-step guide to deploy DynamoDB infrastructure using Terraform.

## Prerequisites

- [x] AWS Account with appropriate permissions
- [x] AWS CLI installed and configured
- [x] Terraform >= 1.0 installed
- [x] S3 bucket for Terraform state (already configured: `yo-terraform-state`)
- [x] DynamoDB table for state locking (already configured: `yo-terraform-locks`)

## Pre-Deployment Checklist

### 1. Verify AWS Credentials

```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

### 2. Verify Terraform Installation

```bash
terraform version
```

Expected output:
```
Terraform v1.x.x
```

### 3. Verify Required IAM Permissions

Your IAM user/role needs these permissions:
- `dynamodb:*`
- `iam:CreatePolicy`
- `iam:AttachRolePolicy`
- `cloudwatch:PutMetricAlarm`
- `application-autoscaling:*`

## Deployment Steps

### Step 1: Navigate to Infrastructure Directory

```bash
cd infrastructure/staging
```

### Step 2: Create Configuration File

```bash
cp terraform.tfvars.example terraform.tfvars
```

### Step 3: Edit Configuration

Edit `terraform.tfvars`:

```hcl
# AWS Configuration
aws_region = "us-east-1"

# EC2 Configuration (existing)
ami_id        = "ami-0c55b159cbfafe1f0"
instance_type = "t3.medium"
key_name      = "your-key-pair-name"

# Security
security_group_name = "staging-security-group"

# DynamoDB Configuration
dynamodb_notifications_table_name = "staging-user-notifications"
dynamodb_billing_mode              = "PAY_PER_REQUEST"
dynamodb_stream_enabled            = true
dynamodb_stream_view_type          = "NEW_AND_OLD_IMAGES"
dynamodb_ttl_enabled               = true
dynamodb_ttl_attribute_name        = "ttl"
dynamodb_pitr_enabled              = false  # Set true for production
dynamodb_prevent_destroy           = false  # Set true for production
dynamodb_enable_alarms             = false  # Set true for production
```

### Step 4: Initialize Terraform

```bash
terraform init
```

**What this does:**
- Downloads required providers (AWS)
- Initializes backend (S3 + DynamoDB)
- Prepares modules

Expected output:
```
Initializing modules...
- dynamodb in modules/dynamodb
- ses_templates in templates/email_confirmation

Initializing the backend...

Successfully configured the backend "s3"!

Initializing provider plugins...
- Finding latest version of hashicorp/aws...
- Installing hashicorp/aws v5.x.x...

Terraform has been successfully initialized!
```

### Step 5: Validate Configuration

```bash
terraform validate
```

Expected output:
```
Success! The configuration is valid.
```

### Step 6: Format Code (Optional)

```bash
terraform fmt -recursive
```

### Step 7: Plan Deployment

```bash
terraform plan -out=tfplan
```

**Review the plan carefully!** You should see:
- `aws_dynamodb_table.notifications` will be created
- `aws_iam_policy.dynamodb_access` will be created
- `aws_iam_policy.dynamodb_read_only` will be created
- `aws_iam_role_policy_attachment.dynamodb_access` will be created
- Existing `aws_iam_role.ec2_ecr_role` will be updated
- CloudWatch alarms (if enabled)

Expected output:
```
Plan: X to add, Y to change, 0 to destroy.
```

### Step 8: Apply Configuration

```bash
terraform apply tfplan
```

Or interactively:
```bash
terraform apply
```

Type `yes` when prompted.

Expected output:
```
Apply complete! Resources: X added, Y changed, 0 destroyed.

Outputs:

dynamodb_access_policy_arn = "arn:aws:iam::123456789:policy/staging-dynamodb-notifications-access"
dynamodb_notifications_table_arn = "arn:aws:dynamodb:us-east-1:123456789:table/staging-user-notifications"
dynamodb_notifications_table_name = "staging-user-notifications"
dynamodb_notifications_stream_arn = "arn:aws:dynamodb:us-east-1:123456789:table/staging-user-notifications/stream/2025-01-18..."
```

### Step 9: Verify Resources Created

#### Check DynamoDB Table

```bash
aws dynamodb describe-table --table-name staging-user-notifications
```

#### Check IAM Policy

```bash
aws iam get-policy --policy-arn <dynamodb_access_policy_arn>
```

#### Check CloudWatch Alarms (if enabled)

```bash
aws cloudwatch describe-alarms --alarm-name-prefix staging-user-notifications
```

### Step 10: View Outputs

```bash
terraform output
```

Or for specific output:
```bash
terraform output dynamodb_notifications_table_name
```

## Post-Deployment Tasks

### 1. Update Application Configuration

Update your application's `.env` file:

```bash
# Get the table name from Terraform output
TABLE_NAME=$(terraform output -raw dynamodb_notifications_table_name)

# Add to .env
echo "DYNAMODB_NOTIFICATIONS_TABLE=$TABLE_NAME" >> ../../apps/api-gateway/.env
echo "AWS_REGION=us-east-1" >> ../../apps/api-gateway/.env
```

### 2. Test DynamoDB Access from EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@<ec2-public-ip>
```

Test AWS CLI access:

```bash
aws dynamodb describe-table --table-name staging-user-notifications --region us-east-1
```

### 3. Test from Application

```bash
cd /path/to/twitter-backend-node
npm run dynamodb:create-tables
```

This should show:
```
✅ Table "staging-user-notifications" created successfully
```

### 4. Configure TTL (One-Time Setup)

TTL is configured by Terraform, but verify it's enabled:

```bash
aws dynamodb describe-time-to-live --table-name staging-user-notifications
```

Expected output:
```json
{
    "TimeToLiveDescription": {
        "TimeToLiveStatus": "ENABLED",
        "AttributeName": "ttl"
    }
}
```

### 5. Set Up CloudWatch Dashboard (Optional)

Create a dashboard to monitor your DynamoDB table:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name "DynamoDB-Notifications" \
  --dashboard-body file://cloudwatch-dashboard.json
```

## Rollback Procedure

If something goes wrong, you can rollback:

### Option 1: Terraform Rollback

```bash
# Show previous state versions
terraform state list

# Revert to previous configuration
git checkout HEAD~1 infrastructure/staging/

# Re-apply
terraform apply
```

### Option 2: Destroy DynamoDB Resources Only

```bash
# Target specific resources
terraform destroy -target=module.dynamodb
```

### Option 3: Full Rollback (Nuclear Option)

```bash
# Destroy all Terraform-managed resources
terraform destroy
```

**⚠️ Warning:** This will destroy ALL resources including EC2, VPC, etc.

## Updating the Configuration

### Scenario 1: Change Billing Mode

Edit `terraform.tfvars`:
```hcl
dynamodb_billing_mode = "PROVISIONED"
```

Apply changes:
```bash
terraform plan
terraform apply
```

### Scenario 2: Enable CloudWatch Alarms

Edit `terraform.tfvars`:
```hcl
dynamodb_enable_alarms = true
```

Apply:
```bash
terraform apply
```

### Scenario 3: Enable PITR for Production

Edit `terraform.tfvars`:
```hcl
dynamodb_pitr_enabled = true
```

Apply:
```bash
terraform apply
```

## Common Issues & Solutions

### Issue 1: "Table Already Exists"

**Problem:** You created the table manually before

**Solution:**
```bash
# Import existing table
terraform import module.dynamodb.aws_dynamodb_table.notifications staging-user-notifications

# Then apply
terraform apply
```

### Issue 2: "Access Denied"

**Problem:** IAM permissions missing

**Solution:**
1. Ensure AWS credentials are configured
2. Add required IAM permissions
3. Try: `aws sts get-caller-identity` to verify

### Issue 3: "Backend Initialization Failed"

**Problem:** S3 bucket doesn't exist

**Solution:**
```bash
cd infrastructure/staging/bootstrap
terraform apply
```

### Issue 4: State Lock Error

**Problem:** Previous operation didn't complete

**Solution:**
```bash
# Check DynamoDB for locks
aws dynamodb scan --table-name yo-terraform-locks

# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

### Issue 5: Module Not Found

**Problem:** Module path incorrect

**Solution:**
```bash
# Re-initialize
terraform init -upgrade
```

## Production Deployment

For production, create a separate directory:

```bash
cp -r infrastructure/staging infrastructure/production
cd infrastructure/production
```

Update `terraform.tfvars`:

```hcl
# Production-specific settings
dynamodb_notifications_table_name = "prod-user-notifications"
dynamodb_billing_mode              = "PAY_PER_REQUEST"
dynamodb_pitr_enabled              = true   # Enable backups
dynamodb_prevent_destroy           = true   # Prevent deletion
dynamodb_enable_alarms             = true   # Enable monitoring

# Use different S3 backend
# Edit main.tf backend configuration:
# key = "production/terraform.tfstate"
```

Then follow the same deployment steps.

## Monitoring & Maintenance

### View CloudWatch Metrics

```bash
# Read capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=staging-user-notifications \
  --start-time 2025-01-18T00:00:00Z \
  --end-time 2025-01-18T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Check Table Size

```bash
aws dynamodb describe-table \
  --table-name staging-user-notifications \
  --query 'Table.[TableSizeBytes,ItemCount]'
```

### Export DynamoDB Data (Backup)

```bash
aws dynamodb create-backup \
  --table-name staging-user-notifications \
  --backup-name staging-notifications-backup-$(date +%Y%m%d)
```

## Cost Monitoring

### View Current Month Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://dynamodb-filter.json
```

`dynamodb-filter.json`:
```json
{
  "Tags": {
    "Key": "Service",
    "Values": ["DynamoDB"]
  }
}
```

## Cleanup (Development Only)

To remove all DynamoDB resources:

```bash
# First, disable prevent_destroy
# Edit terraform.tfvars:
dynamodb_prevent_destroy = false

# Then destroy
terraform destroy -target=module.dynamodb

# Confirm with: yes
```

## Summary Checklist

- [ ] AWS credentials configured
- [ ] `terraform.tfvars` created and edited
- [ ] `terraform init` completed successfully
- [ ] `terraform plan` reviewed
- [ ] `terraform apply` executed
- [ ] Resources verified in AWS Console
- [ ] Application `.env` updated
- [ ] DynamoDB access tested from EC2
- [ ] TTL verified
- [ ] CloudWatch alarms configured (production)
- [ ] Documentation updated

## Next Steps

1. Test the notifications system with your application
2. Monitor CloudWatch metrics
3. Set up production environment
4. Configure backup retention policies
5. Implement DynamoDB Streams processing (Lambda)

## Support

- Terraform Documentation: https://terraform.io/docs
- AWS DynamoDB: https://docs.aws.amazon.com/dynamodb/
- Module README: [modules/dynamodb/README.md](modules/dynamodb/README.md)
- Main Documentation: [DYNAMODB_TERRAFORM.md](DYNAMODB_TERRAFORM.md)
