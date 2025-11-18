# Terraform Commands Quick Reference

Quick reference for common Terraform operations with DynamoDB infrastructure.

## Essential Commands

### Initialize

```bash
# Initialize Terraform (run first time and after module changes)
terraform init

# Upgrade providers and modules
terraform init -upgrade

# Reconfigure backend
terraform init -reconfigure
```

### Plan

```bash
# Show execution plan
terraform plan

# Save plan to file
terraform plan -out=tfplan

# Plan with specific var file
terraform plan -var-file="production.tfvars"

# Plan for specific resource
terraform plan -target=module.dynamodb
```

### Apply

```bash
# Apply changes interactively
terraform apply

# Apply saved plan
terraform apply tfplan

# Apply without confirmation (use with caution)
terraform apply -auto-approve

# Apply specific resource
terraform apply -target=module.dynamodb
```

### Destroy

```bash
# Destroy all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=module.dynamodb

# Destroy without confirmation (dangerous!)
terraform destroy -auto-approve
```

### Outputs

```bash
# Show all outputs
terraform output

# Show specific output
terraform output dynamodb_notifications_table_name

# Show output as raw value (no quotes)
terraform output -raw dynamodb_notifications_table_name

# Output in JSON format
terraform output -json
```

## State Management

### View State

```bash
# List all resources in state
terraform state list

# Show specific resource
terraform state show module.dynamodb.aws_dynamodb_table.notifications

# Show all state
terraform show
```

### Import Resources

```bash
# Import existing DynamoDB table
terraform import module.dynamodb.aws_dynamodb_table.notifications staging-user-notifications

# Import IAM policy
terraform import module.dynamodb.aws_iam_policy.dynamodb_access arn:aws:iam::123456789:policy/staging-dynamodb-access
```

### Move Resources

```bash
# Move resource within state
terraform state mv module.dynamodb.aws_dynamodb_table.notifications module.dynamodb_v2.aws_dynamodb_table.notifications

# Rename resource
terraform state mv aws_dynamodb_table.old_name aws_dynamodb_table.new_name
```

### Remove from State

```bash
# Remove resource from state (doesn't delete actual resource)
terraform state rm module.dynamodb.aws_dynamodb_table.notifications
```

## Validation & Formatting

```bash
# Validate configuration
terraform validate

# Format code
terraform fmt

# Format recursively
terraform fmt -recursive

# Check formatting without making changes
terraform fmt -check
```

## Workspaces (for multiple environments)

```bash
# List workspaces
terraform workspace list

# Create new workspace
terraform workspace new production

# Switch workspace
terraform workspace select staging

# Show current workspace
terraform workspace show

# Delete workspace
terraform workspace delete staging
```

## Advanced Commands

### Refresh State

```bash
# Refresh state from actual infrastructure
terraform refresh

# Refresh and show updates
terraform plan -refresh-only
```

### Tainting (force recreation)

```bash
# Mark resource for recreation
terraform taint module.dynamodb.aws_dynamodb_table.notifications

# Untaint resource
terraform untaint module.dynamodb.aws_dynamodb_table.notifications
```

### Graph

```bash
# Generate visual dependency graph
terraform graph | dot -Tpng > graph.png
```

### Console

```bash
# Interactive console for testing expressions
terraform console

# Example queries in console:
# > module.dynamodb.notifications_table_name
# > var.dynamodb_billing_mode
# > aws_vpc.staging_vpc.id
```

## DynamoDB-Specific Operations

### Deploy DynamoDB Only

```bash
# Plan DynamoDB changes only
terraform plan -target=module.dynamodb

# Apply DynamoDB changes only
terraform apply -target=module.dynamodb
```

### Update Table Settings

```bash
# Change billing mode
terraform apply -var="dynamodb_billing_mode=PROVISIONED"

# Enable PITR
terraform apply -var="dynamodb_pitr_enabled=true"

# Enable alarms
terraform apply -var="dynamodb_enable_alarms=true"
```

### View DynamoDB Outputs

```bash
# Table name
terraform output dynamodb_notifications_table_name

# Table ARN
terraform output dynamodb_notifications_table_arn

# Stream ARN
terraform output dynamodb_notifications_stream_arn

# Policy ARN
terraform output dynamodb_access_policy_arn
```

## Debugging

### Enable Debug Logging

```bash
# Set log level
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform.log

# Run command with logging
terraform apply

# Disable logging
unset TF_LOG
unset TF_LOG_PATH
```

### Log Levels

```bash
# TRACE - Most verbose
export TF_LOG=TRACE

# DEBUG - Detailed debug info
export TF_LOG=DEBUG

# INFO - General info
export TF_LOG=INFO

# WARN - Warnings only
export TF_LOG=WARN

# ERROR - Errors only
export TF_LOG=ERROR
```

## Environment Variables

```bash
# AWS credentials
export AWS_PROFILE=staging
export AWS_REGION=us-east-1

# Terraform variables
export TF_VAR_aws_region=us-east-1
export TF_VAR_dynamodb_billing_mode=PAY_PER_REQUEST

# Backend configuration
export TF_CLI_ARGS_init="-backend-config=bucket=my-terraform-state"
```

## Lock Management

```bash
# Show lock info
aws dynamodb get-item \
  --table-name yo-terraform-locks \
  --key '{"LockID":{"S":"yo-terraform-state/staging/terraform.tfstate"}}'

# Force unlock (use with extreme caution)
terraform force-unlock <lock-id>
```

## Common Workflows

### First-Time Setup

```bash
cd infrastructure/staging
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init
terraform plan
terraform apply
```

### Daily Development

```bash
# Make changes to .tf files
terraform fmt
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

### Update DynamoDB Settings

```bash
# Edit terraform.tfvars or variables
terraform plan -target=module.dynamodb
terraform apply -target=module.dynamodb
```

### Troubleshooting

```bash
# Validate syntax
terraform validate

# Refresh state
terraform refresh

# Show current state
terraform show

# Check specific resource
terraform state show module.dynamodb.aws_dynamodb_table.notifications
```

### Migrate State

```bash
# Pull current state
terraform state pull > backup.tfstate

# Push state
terraform state push backup.tfstate
```

### Import Existing Infrastructure

```bash
# Import DynamoDB table
terraform import module.dynamodb.aws_dynamodb_table.notifications staging-user-notifications

# Import IAM policy
terraform import module.dynamodb.aws_iam_policy.dynamodb_access arn:aws:iam::123:policy/staging-dynamodb-access

# Import CloudWatch alarm
terraform import module.dynamodb.aws_cloudwatch_metric_alarm.read_throttle_events[0] staging-user-notifications-read-throttle
```

## Production Deployment

```bash
# Switch to production directory
cd infrastructure/production

# Use production config
terraform init
terraform workspace new production  # Optional
terraform plan -var-file="production.tfvars" -out=prod.tfplan

# Review plan carefully!
terraform show prod.tfplan

# Apply with approval step
terraform apply prod.tfplan
```

## Disaster Recovery

### Backup State

```bash
# Manual backup
terraform state pull > terraform-$(date +%Y%m%d-%H%M%S).tfstate

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
terraform state pull > backups/terraform-state-$DATE.tfstate
```

### Restore State

```bash
# From local backup
terraform state push terraform-20250118-120000.tfstate

# From S3 (if using S3 backend)
aws s3 cp s3://yo-terraform-state/staging/terraform.tfstate.backup ./
terraform state push terraform.tfstate.backup
```

## Cost Estimation

```bash
# Using Infracost (install first: https://www.infracost.io/)
infracost breakdown --path .

# With saved plan
infracost breakdown --path tfplan.json
```

## Testing

```bash
# Validate all configurations
terraform validate

# Format check
terraform fmt -check -recursive

# Security scan (using tfsec)
tfsec .

# Policy compliance (using Checkov)
checkov -d .
```

## CI/CD Integration

```bash
# GitHub Actions / GitLab CI
terraform init -input=false
terraform validate
terraform plan -input=false -out=tfplan
terraform apply -input=false tfplan

# With approval step
terraform plan -input=false -out=tfplan
# Wait for manual approval
terraform apply -input=false tfplan
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Terraform aliases
alias tf='terraform'
alias tfi='terraform init'
alias tfp='terraform plan'
alias tfa='terraform apply'
alias tfd='terraform destroy'
alias tfo='terraform output'
alias tfs='terraform state'
alias tfv='terraform validate'
alias tff='terraform fmt -recursive'

# DynamoDB-specific
alias tfp-dynamo='terraform plan -target=module.dynamodb'
alias tfa-dynamo='terraform apply -target=module.dynamodb'
alias tfo-table='terraform output dynamodb_notifications_table_name'
```

## Quick Checklist

Before running `terraform apply`:

- [ ] `terraform fmt` - Format code
- [ ] `terraform validate` - Validate syntax
- [ ] `terraform plan` - Review changes
- [ ] Check `prevent_destroy` settings
- [ ] Backup state file
- [ ] Review cost implications
- [ ] Notify team (for shared infrastructure)
- [ ] `terraform apply` - Apply changes
- [ ] Verify in AWS Console
- [ ] Update documentation

## Resources

- [Terraform CLI Documentation](https://www.terraform.io/cli)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
