# Notifications Module - DynamoDB Implementation

A real-time notification system built with **Amazon DynamoDB** for the Twitter-like backend. This module demonstrates how to use DynamoDB for high-performance, scalable notifications.

## Table of Contents
- [Overview](#overview)
- [Why DynamoDB?](#why-dynamodb)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Event-Driven Notifications](#event-driven-notifications)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)

---

## Overview

This module provides:
- ✅ **Real-time notifications** (likes, follows, replies, reposts, mentions)
- ✅ **DynamoDB storage** with automatic TTL (90-day expiration)
- ✅ **Kafka integration** for event-driven notification creation
- ✅ **Paginated API** with cursor-based navigation
- ✅ **Read/unread tracking** with bulk operations
- ✅ **DynamoDB Streams** ready for real-time push notifications (WebSockets)

---

## Why DynamoDB?

### Advantages over MySQL/Redis:

| Feature | DynamoDB | MySQL | Redis |
|---------|----------|-------|-------|
| **Write Throughput** | Millions/sec | ~10K/sec | 100K/sec |
| **Latency** | 1-5ms | 10-50ms | <1ms |
| **Auto-Scaling** | Automatic | Manual | Manual |
| **TTL** | Built-in | Manual cleanup | Built-in |
| **Persistence** | Durable | Durable | Volatile (unless AOF) |
| **Cost** | Pay-per-request | Fixed server costs | Fixed server costs |

### Perfect for Notifications Because:
1. **High Write Volume**: Every like/follow/reply generates a notification
2. **Time-Series Data**: Notifications naturally sorted by timestamp
3. **TTL**: Auto-delete old notifications (no cleanup jobs needed)
4. **Scalability**: Handles millions of users without provisioning
5. **DynamoDB Streams**: Real-time change data capture for WebSockets

---

## Architecture

```
┌─────────────────┐
│  User Actions   │
│ (like, follow)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Kafka Events   │
│  (event bus)    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ NotificationsKafkaConsumer│
│  (listens to events)      │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  NotificationsService   │
│  (business logic)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│    DynamoDBService      │
│  (DynamoDB operations)  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Amazon DynamoDB       │
│  (user-notifications)   │
└─────────────────────────┘
```

---

## Data Model

### DynamoDB Table: `user-notifications`

**Access Pattern**: "Get all notifications for a user, sorted by newest first"

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String (Partition Key) | `USER#<userId>` - Groups notifications by user |
| `SK` | String (Sort Key) | `NOTIF#<timestamp>#<notifId>` - Sorts chronologically |
| `notificationId` | String | UUID for the notification |
| `type` | String | Enum: `like`, `follow`, `reply`, `repost`, `mention` |
| `actorId` | String | User who triggered the notification |
| `actorUsername` | String | Denormalized for fast display |
| `actorAvatar` | String | Denormalized for fast display |
| `postId` | String (optional) | Related post ID |
| `postText` | String (optional) | Denormalized snippet |
| `read` | Boolean | Read/unread status |
| `readAt` | Number (optional) | Timestamp when marked as read |
| `createdAt` | Number | Timestamp when created |
| `ttl` | Number | Unix timestamp for automatic deletion (90 days) |

### Example Item:

```json
{
  "PK": "USER#123e4567-e89b-12d3-a456-426614174000",
  "SK": "NOTIF#1735900800000#abc-def-ghi",
  "notificationId": "abc-def-ghi",
  "type": "like",
  "actorId": "789-xyz",
  "actorUsername": "john_doe",
  "actorAvatar": "https://...",
  "postId": "post-456",
  "postText": "Hello world!",
  "read": false,
  "createdAt": 1735900800000,
  "ttl": 1743676800
}
```

### Query Examples:

```typescript
// Get user's latest notifications
PK = "USER#<userId>" AND SK begins_with "NOTIF#"
// Returns sorted by SK (timestamp) descending

// Filter unread only
PK = "USER#<userId>" WHERE read = false
```

---

## Setup

### 1. Install Dependencies

Already done! The following packages are installed:
- `@aws-sdk/client-dynamodb` - DynamoDB client
- `@aws-sdk/lib-dynamodb` - Document client for easier JSON operations

### 2. Configure Environment Variables

Add to your `.env`:

```bash
# DynamoDB Configuration
# For local development, use DynamoDB Local endpoint
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_NOTIFICATIONS_TABLE=user-notifications

# For production, leave DYNAMODB_ENDPOINT empty
# DYNAMODB_ENDPOINT=
# DYNAMODB_NOTIFICATIONS_TABLE=prod-user-notifications
```

### 3. Create DynamoDB Table

**Option A: Using the script (local or AWS)**
```bash
npm run dynamodb:create-tables
```

**Option B: Force recreate**
```bash
npm run dynamodb:create-tables:force
```

The script will:
- ✅ Create `user-notifications` table
- ✅ Configure partition key (PK) and sort key (SK)
- ✅ Enable DynamoDB Streams
- ✅ Set billing mode to PAY_PER_REQUEST

### 4. Enable TTL (Manual Step)

**For AWS DynamoDB:**
1. Go to AWS Console → DynamoDB → Tables → `user-notifications`
2. Additional settings → Time to Live (TTL)
3. Enable TTL with attribute name: `ttl`

**For DynamoDB Local:**
TTL is not supported locally, but the attribute is still stored.

---

## API Endpoints

All endpoints require Bearer token authentication.

### 1. Get Notifications (Paginated)

```http
GET /notifications?limit=20&cursor=<base64>&unreadOnly=false
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "abc-def-ghi",
      "type": "like",
      "actor": {
        "id": "789-xyz",
        "username": "john_doe",
        "avatar": "https://..."
      },
      "post": {
        "id": "post-456",
        "text": "Hello world!"
      },
      "read": false,
      "createdAt": 1735900800000
    }
  ],
  "nextCursor": "eyJQSyI6Ii4uLiJ9",
  "unreadCount": 5
}
```

### 2. Get Unread Count

```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 5
}
```

### 3. Mark as Read

```http
POST /notifications/:id/read
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### 4. Mark All as Read

```http
POST /notifications/read-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 12
}
```

### 5. Delete Notification

```http
DELETE /notifications/:id
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Event-Driven Notifications

Notifications are automatically created from Kafka events:

### Supported Events:

| Kafka Topic | Notification Type | Description |
|-------------|-------------------|-------------|
| `message-liked` | `like` | User likes a post |
| `user-followed` | `follow` | User follows another user |
| `post-reposted` | `repost` | User reposts a post |
| `post-created` (with reply) | `reply` | User replies to a post |
| `post-created` (with mentions) | `mention` | User mentions others in post |

### Event Structure Examples:

**Like Event:**
```json
{
  "postId": "uuid",
  "postAuthorId": "uuid",
  "likerId": "uuid",
  "likerUsername": "john_doe",
  "likerAvatar": "https://...",
  "postText": "Hello world!"
}
```

**Follow Event:**
```json
{
  "followerId": "uuid",
  "followerUsername": "jane_smith",
  "followerAvatar": "https://...",
  "followeeId": "uuid"
}
```

---

## Local Development

### Option 1: DynamoDB Local (Docker)

```bash
# Start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# In another terminal, create tables
npm run dynamodb:create-tables

# Start the application
npm run start:api-gateway
```

### Option 2: Use AWS DynamoDB

```bash
# Remove DYNAMODB_ENDPOINT from .env (or set it to empty)
DYNAMODB_ENDPOINT=

# Create tables in AWS
npm run dynamodb:create-tables

# Start the application
npm run start:api-gateway
```

### Testing Notifications

1. **Create a like event** (via Kafka or API):
   ```bash
   # Trigger a like via API
   POST /posts/:postId/like
   ```

2. **Check notifications**:
   ```bash
   GET /notifications
   ```

---

## Production Deployment

### 1. Create Production Table

```bash
# Set production environment
export NODE_ENV=production
export DYNAMODB_NOTIFICATIONS_TABLE=prod-user-notifications
unset DYNAMODB_ENDPOINT  # Use AWS DynamoDB

# Create table
npm run dynamodb:create-tables
```

### 2. Enable TTL

AWS Console → DynamoDB → Tables → `prod-user-notifications` → Additional settings → TTL → Enable with attribute `ttl`

### 3. Configure Auto-Scaling (Optional)

If using provisioned billing instead of on-demand:
- AWS Console → DynamoDB → Tables → `prod-user-notifications` → Additional settings → Auto Scaling
- Set target utilization to 70%

### 4. Monitor with CloudWatch

Key metrics to monitor:
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors` (throttling)
- `SystemErrors`

### 5. Set Up DynamoDB Streams (Optional)

For real-time push notifications via WebSockets:

1. Enable Streams (already done by script)
2. Create Lambda function to process stream events
3. Trigger WebSocket notifications to connected clients

---

## File Structure

```
notifications/
├── dynamodb.config.ts          # DynamoDB client configuration
├── dynamodb.service.ts         # Low-level DynamoDB operations
├── notifications.service.ts    # Business logic
├── notifications.controller.ts # REST API endpoints
├── notifications.kafka.consumer.ts # Event listeners
├── notifications.module.ts     # NestJS module
├── notification.types.ts       # TypeScript types
├── dto/
│   └── notification.dto.ts    # Request/response DTOs
└── README.md                   # This file
```

---

## Performance Characteristics

### Latency:
- **Read (single user)**: 1-5ms
- **Write (single notification)**: 1-5ms
- **Paginated query (20 items)**: 5-10ms

### Throughput:
- **Reads**: Unlimited (on-demand)
- **Writes**: Unlimited (on-demand)
- **Burst capacity**: Handles sudden spikes automatically

### Cost (Approximate):
- **Reads**: $0.25 per million requests
- **Writes**: $1.25 per million requests
- **Storage**: $0.25 per GB/month
- **TTL deletes**: Free

**Example**: 1M users, 10 notifications/day each, 90-day retention:
- Writes: 10M/day = $12.50/day
- Reads: 50M/day = $12.50/day
- Storage: ~50GB = $12.50/month
- **Total: ~$750/month** (scales linearly with usage)

---

## Next Steps

1. **Add WebSockets**: Use DynamoDB Streams to trigger real-time notifications
2. **Add Push Notifications**: Integrate with Firebase/SNS for mobile push
3. **Add Email Digests**: Daily/weekly notification summaries via SES
4. **Add Notification Preferences**: Let users configure what they want to receive
5. **Add Global Secondary Index**: Query by `type` or `actorId` for analytics

---

## Troubleshooting

### Error: "Cannot connect to DynamoDB"
- Check `DYNAMODB_ENDPOINT` is correct (localhost:8000 for local)
- Ensure DynamoDB Local is running: `docker ps`
- For AWS, check IAM permissions

### Error: "Table does not exist"
- Run `npm run dynamodb:create-tables`
- Check table name matches `.env` configuration

### Notifications not appearing
- Check Kafka consumers are running: Look for log messages
- Verify Kafka events are being published
- Check DynamoDB table for items: AWS Console or `aws dynamodb scan`

### Slow queries
- Add GSI if querying by attributes other than PK/SK
- Ensure `limit` parameter is set appropriately (default: 20)
- Check DynamoDB CloudWatch metrics for throttling

---

## Additional Resources

- [AWS DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

---

**Built with ❤️ using NestJS + DynamoDB + Kafka**
