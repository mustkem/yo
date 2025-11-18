# DynamoDB Implementation - Notifications System

## Overview

This project now includes a complete **Notifications System** powered by **Amazon DynamoDB**. This demonstrates how to use DynamoDB as a NoSQL database for high-performance, scalable features in a Node.js/NestJS backend.

---

## What Was Implemented

### 1. **Notifications Module** (`apps/api-gateway/src/modules/notifications/`)

A complete notification system with:

- ✅ Real-time notification creation via Kafka events
- ✅ DynamoDB for storage (fast, scalable, serverless)
- ✅ REST API endpoints for CRUD operations
- ✅ Automatic TTL (notifications expire after 90 days)
- ✅ Pagination with cursor-based navigation
- ✅ Read/unread tracking
- ✅ Support for multiple notification types (like, follow, reply, repost, mention)

### 2. **File Structure**

```
apps/api-gateway/src/modules/notifications/
├── dynamodb.config.ts              # DynamoDB client setup
├── dynamodb.service.ts             # Low-level DynamoDB operations
├── notifications.service.ts        # Business logic
├── notifications.controller.ts     # REST API endpoints
├── notifications.kafka.consumer.ts # Event listeners
├── notifications.module.ts         # NestJS module
├── notification.types.ts           # TypeScript types
├── dto/
│   └── notification.dto.ts        # Request/response DTOs
├── README.md                       # Detailed documentation
└── TESTING.md                      # Step-by-step testing guide

database/dynamodb/
└── create-tables.ts               # DynamoDB table creation script
```

### 3. **Dependencies Installed**

```json
{
  "@aws-sdk/client-dynamodb": "^3.932.0",
  "@aws-sdk/lib-dynamodb": "^3.932.0"
}
```

### 4. **Infrastructure as Code (Terraform)**

DynamoDB tables are managed using Terraform:

- **Location**: `infrastructure/staging/modules/dynamodb/`
- **Deploy**: `cd infrastructure/staging && terraform apply`
- **Features**: IAM policies, CloudWatch alarms, PITR, auto-scaling

### 5. **Environment Variables**

Added to `.env`:

```bash
DYNAMODB_NOTIFICATIONS_TABLE=staging-user-notifications  # Table name from Terraform
AWS_REGION=us-east-1
```

---

## Why DynamoDB for Notifications?

### Key Benefits:

1. **High Write Throughput**: Handles millions of notifications per second
2. **Low Latency**: 1-5ms read/write times
3. **Auto-Scaling**: No provisioning needed with on-demand billing
4. **Built-in TTL**: Automatically deletes old notifications (no cleanup jobs)
5. **DynamoDB Streams**: Enable real-time WebSocket notifications
6. **Serverless**: No servers to manage
7. **Cost-Effective**: Pay only for what you use

### Perfect for:

- ✅ High-volume user notifications
- ✅ Time-series data (naturally sorted by timestamp)
- ✅ Event-driven architectures
- ✅ Real-time applications

---

## DynamoDB Data Model

### Table: `user-notifications`

| Key    | Type          | Description                                           |
| ------ | ------------- | ----------------------------------------------------- |
| **PK** | Partition Key | `USER#<userId>` - Groups notifications by user        |
| **SK** | Sort Key      | `NOTIF#<timestamp>#<notifId>` - Chronological sorting |

**Additional Attributes:**

- `notificationId` (UUID)
- `type` (like, follow, reply, repost, mention)
- `actorId`, `actorUsername`, `actorAvatar` (who triggered it)
- `postId`, `postText` (related post, if applicable)
- `read` (boolean), `readAt` (timestamp)
- `createdAt` (timestamp)
- `ttl` (Unix timestamp for auto-deletion after 90 days)

**Access Pattern:**

```
Query: PK = "USER#<userId>" AND SK begins_with "NOTIF#"
Result: All notifications for a user, sorted newest first
```

---

## API Endpoints

All endpoints require Bearer token authentication.

### Get Notifications

```http
GET /notifications?limit=20&cursor=<base64>&unreadOnly=false
Authorization: Bearer <token>
```

### Get Unread Count

```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read

```http
POST /notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read

```http
POST /notifications/read-all
Authorization: Bearer <token>
```

### Delete Notification

```http
DELETE /notifications/:id
Authorization: Bearer <token>
```

---

## Event-Driven Architecture

Notifications are automatically created from Kafka events:

| Kafka Topic                           | Notification Type | Trigger                   |
| ------------------------------------- | ----------------- | ------------------------- |
| `message-liked`                       | `like`            | User likes a post         |
| `user-followed`                       | `follow`          | User follows another user |
| `post-reposted`                       | `repost`          | User reposts a post       |
| `post-created` (with `replyToPostId`) | `reply`           | User replies to a post    |
| `post-created` (with `mentions`)      | `mention`         | User mentions others      |

### Flow:

```
User Action (like post)
    ↓
Kafka Event Published
    ↓
NotificationsKafkaConsumer
    ↓
NotificationsService
    ↓
DynamoDBService
    ↓
DynamoDB Table
```

---

## Quick Start

### 1. Deploy DynamoDB with Terraform

```bash
cd infrastructure/staging
terraform init
terraform plan
terraform apply
```

### 2. Start Infrastructure

```bash
# Start Kafka, MySQL, Redis, Elasticsearch
npm run docker:up
```

### 3. Start Application

```bash
npm run start:api-gateway
```

### 4. Test

Follow the testing guide: [`apps/api-gateway/src/modules/notifications/TESTING.md`](apps/api-gateway/src/modules/notifications/TESTING.md)

---

## Production Deployment

### 1. Deploy with Terraform

```bash
# Copy staging configuration
cp -r infrastructure/staging infrastructure/production

# Update production settings
cd infrastructure/production
vim terraform.tfvars

# Set production values:
# - dynamodb_notifications_table_name = "prod-user-notifications"
# - dynamodb_pitr_enabled = true
# - dynamodb_prevent_destroy = true
# - dynamodb_enable_alarms = true

# Deploy
terraform init
terraform plan
terraform apply
```

### 2. Update Application Environment

Update `.env`:

```bash
DYNAMODB_NOTIFICATIONS_TABLE=prod-user-notifications
AWS_REGION=us-east-1
```

### 3. Verify Configuration

TTL, PITR, and CloudWatch alarms are automatically configured by Terraform.

Verify:

```bash
terraform output dynamodb_notifications_table_name
aws dynamodb describe-table --table-name prod-user-notifications
```

### 4. Monitor with CloudWatch

Key metrics:

- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors` (throttling)
- `SystemErrors`

---

## Cost Estimation

### Example Scenario:

- 1 million users
- 10 notifications per user per day
- 90-day retention (TTL)

### Monthly Costs:

- **Writes**: 10M/day × 30 days = 300M writes/month
  - Cost: 300M × $1.25/million = **$375/month**
- **Reads**: 50M/day × 30 days = 1.5B reads/month
  - Cost: 1.5B × $0.25/million = **$375/month**
- **Storage**: ~50GB
  - Cost: 50GB × $0.25/GB = **$12.50/month**
- **TTL Deletes**: Free

**Total: ~$762.50/month** for 1M users

Compare to:

- MySQL RDS (db.r5.large): ~$1,200/month + storage
- Redis ElastiCache (cache.r5.large): ~$800/month

---

## Performance Characteristics

### Latency:

- Read (single user): **1-5ms**
- Write (single notification): **1-5ms**
- Paginated query (20 items): **5-10ms**

### Throughput:

- On-demand mode: **Unlimited**
- Burst capacity: Handles sudden spikes automatically

### Scalability:

- Horizontal: Automatic partition splitting
- Vertical: No limits on item size (up to 400KB per item)

---

## Next Steps / Future Enhancements

### 1. Real-Time Push Notifications

Use DynamoDB Streams + Lambda + WebSockets:

```
DynamoDB Stream → Lambda Function → API Gateway WebSocket → Client
```

### 2. Mobile Push Notifications

Integrate with Firebase Cloud Messaging (FCM) or AWS SNS:

```
Notification Created → SNS Topic → Mobile Device
```

### 3. Email Digests

Daily/weekly notification summaries:

```
Cron Job → Query Unread Notifications → AWS SES Email
```

### 4. Notification Preferences

Let users configure notification types:

```
DynamoDB Table: user-preferences
PK: USER#<userId>
Attributes: { likeNotifs: true, followNotifs: false, ... }
```

### 5. Advanced Queries

Add Global Secondary Index (GSI) for:

- Query by notification type
- Query by actor (who triggered it)
- Analytics queries

---

## Comparison with Other Approaches

### DynamoDB vs MySQL:

| Feature               | DynamoDB        | MySQL             |
| --------------------- | --------------- | ----------------- |
| **Schema**            | Schemaless      | Fixed schema      |
| **Scalability**       | Automatic       | Manual sharding   |
| **Write Speed**       | Millions/sec    | ~10K/sec          |
| **Query Flexibility** | Limited (PK/SK) | SQL (JOIN, etc.)  |
| **Maintenance**       | None            | Backups, upgrades |
| **Cost Model**        | Pay-per-request | Fixed server cost |

### DynamoDB vs Redis:

| Feature             | DynamoDB  | Redis                 |
| ------------------- | --------- | --------------------- |
| **Persistence**     | Durable   | Volatile (unless AOF) |
| **Latency**         | 1-5ms     | <1ms                  |
| **TTL**             | Built-in  | Built-in              |
| **Complex Queries** | Limited   | Rich data structures  |
| **Scalability**     | Automatic | Manual clustering     |

### When to Use DynamoDB:

✅ High write volume (millions/sec)
✅ Time-series data
✅ Serverless architecture
✅ Automatic scaling needed
✅ Event-driven systems

### When NOT to Use DynamoDB:

❌ Complex queries (JOINs, aggregations)
❌ Strong consistency across multiple items
❌ Transactions across multiple tables
❌ Ad-hoc querying (use Elasticsearch)

---

## Documentation

- **Main README**: [`apps/api-gateway/src/modules/notifications/README.md`](apps/api-gateway/src/modules/notifications/README.md)
  - Detailed architecture
  - Data model explanation
  - Setup instructions
  - Production deployment guide

- **Testing Guide**: [`apps/api-gateway/src/modules/notifications/TESTING.md`](apps/api-gateway/src/modules/notifications/TESTING.md)
  - Step-by-step testing instructions
  - cURL examples
  - Troubleshooting guide
  - Automated test script

---

## Resources

- [AWS DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

---

## Summary

This implementation demonstrates:

1. ✅ **DynamoDB as a primary database** for a feature (notifications)
2. ✅ **Event-driven architecture** with Kafka integration
3. ✅ **NoSQL data modeling** with partition/sort keys
4. ✅ **Production-ready patterns** (TTL, pagination, error handling)
5. ✅ **Hybrid architecture** (DynamoDB + MySQL + Redis + Elasticsearch)

The notifications system showcases DynamoDB's strengths: high throughput, low latency, automatic scaling, and built-in TTL for time-series data.

**Use this as a reference for adding DynamoDB to other features like:**

- User activity feeds/timelines
- Real-time analytics
- Session storage
- Leaderboards/rankings
- Chat/messaging systems

---

**Built with ❤️ using NestJS + DynamoDB + Kafka**
