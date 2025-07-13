# One-Time Bootstrap — Create S3 + DynamoDB. DevOps should run thins from local.

provider "aws" {
  region = "us-east-1"
  
}

resource "aws_s3_bucket" "tf_state" {
  bucket = "yo-terraform-state"
  acl    = "private"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = "Yo Terraform State Bucket"
    Environment = "shared"
  }
}

resource "aws_dynamodb_table" "tf_lock" {
  name         = "yo-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Yo Terraform Lock Table"
    Environment = "shared"
  }
}
