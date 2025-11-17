# Quick Start - Notifications with DynamoDB

Get up and running in 5 minutes!

## TL;DR

```bash
# 1. Start DynamoDB Local
docker run -d -p 8000:8000 amazon/dynamodb-local

# 2. Create table
npm run dynamodb:create-tables

# 3. Start infrastructure
npm run docker:up

# 4. Start app
npm run start:api-gateway

# 5. Test (see below)
```

---

## Test in 60 Seconds

### 1. Create two users and login

```bash
# User 1: Alice
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","name":"Alice","password":"pass123"}'

# Login Alice
ALICE_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass123"}' | jq -r '.token')

# User 2: Bob
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@test.com","name":"Bob","password":"pass123"}'

# Login Bob
BOB_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"pass123"}' | jq -r '.token')
```

### 2. Alice creates a post

```bash
POST_ID=$(curl -s -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Alice!"}' | jq -r '.id')

echo "Post ID: $POST_ID"
```

### 3. Bob likes Alice's post

```bash
curl -X PUT http://localhost:3000/posts/$POST_ID/like \
  -H "Authorization: Bearer $BOB_TOKEN"
```

### 4. Check Alice's notifications

```bash
# Wait 2 seconds for Kafka processing
sleep 2

# Get notifications
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.'
```

**Expected output:**
```json
{
  "notifications": [
    {
      "id": "...",
      "type": "like",
      "actor": {
        "id": "...",
        "username": "bob",
        "avatar": null
      },
      "post": {
        "id": "...",
        "text": "Hello from Alice!"
      },
      "read": false,
      "createdAt": 1735900800000
    }
  ],
  "nextCursor": null,
  "unreadCount": 1
}
```

✅ **Success!** Notification created via Kafka → stored in DynamoDB → retrieved via API.

---

## Key Files

| File | Purpose |
|------|---------|
| `dynamodb.config.ts` | DynamoDB client setup |
| `dynamodb.service.ts` | Low-level DB operations |
| `notifications.service.ts` | Business logic |
| `notifications.controller.ts` | REST API |
| `notifications.kafka.consumer.ts` | Event listeners |

---

## API Cheat Sheet

```bash
# Get notifications (paginated)
GET /notifications?limit=20&cursor=<base64>&unreadOnly=false

# Get unread count
GET /notifications/unread-count

# Mark as read
POST /notifications/:id/read

# Mark all as read
POST /notifications/read-all

# Delete notification
DELETE /notifications/:id
```

All require: `Authorization: Bearer <token>`

---

## Environment Variables

```bash
# Local development (DynamoDB Local)
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_NOTIFICATIONS_TABLE=user-notifications

# Production (AWS DynamoDB)
# DYNAMODB_ENDPOINT=  (leave empty or remove)
DYNAMODB_NOTIFICATIONS_TABLE=prod-user-notifications
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to DynamoDB" | Start DynamoDB Local: `docker run -p 8000:8000 amazon/dynamodb-local` |
| "Table does not exist" | Run: `npm run dynamodb:create-tables` |
| "No notifications" | Check Kafka is running: `docker ps | grep kafka` |
| "401 Unauthorized" | Verify token is valid |

---

## Data Flow

```
User Action (Like)
    ↓
Kafka Event (message-liked)
    ↓
NotificationsKafkaConsumer
    ↓
NotificationsService.createNotification()
    ↓
DynamoDBService.putNotification()
    ↓
DynamoDB Table (user-notifications)
    ↓
API: GET /notifications
```

---

## DynamoDB Table Structure

```
Table: user-notifications
─────────────────────────────────────────────────
PK (Partition Key): USER#<userId>
SK (Sort Key):      NOTIF#<timestamp>#<notifId>
─────────────────────────────────────────────────
Attributes:
  - notificationId (UUID)
  - type (like|follow|reply|repost|mention)
  - actorId, actorUsername, actorAvatar
  - postId, postText (optional)
  - read (boolean)
  - createdAt, readAt, ttl
─────────────────────────────────────────────────
Query: PK = "USER#123" → Get all notifications for user
Sort:  SK descending → Newest first
TTL:   Auto-delete after 90 days
```

---

## What's Unique About This Implementation?

1. ✅ **NoSQL Database** - DynamoDB instead of MySQL
2. ✅ **Event-Driven** - Kafka triggers notification creation
3. ✅ **Auto-Expiry** - TTL deletes old notifications automatically
4. ✅ **High Performance** - 1-5ms read/write latency
5. ✅ **Scalable** - Handles millions of notifications/second
6. ✅ **Cost-Effective** - Pay-per-request (no fixed costs)

---

## Next Steps

1. Read the full documentation: [`README.md`](README.md)
2. Follow the testing guide: [`TESTING.md`](TESTING.md)
3. Check the implementation summary: [`/DYNAMODB_IMPLEMENTATION.md`](../../../../DYNAMODB_IMPLEMENTATION.md)

---

**Happy coding! 🚀**
