# Testing the Notifications System

A step-by-step guide to test the DynamoDB-based notifications system.

## Prerequisites

Before testing, ensure you have:
1. ✅ DynamoDB Local running (or AWS DynamoDB configured)
2. ✅ Kafka running (via Docker Compose)
3. ✅ Redis running
4. ✅ MySQL running
5. ✅ DynamoDB table created

---

## Step 1: Start DynamoDB Local

### Using Docker:

```bash
# Start DynamoDB Local on port 8000
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# Verify it's running
docker ps | grep dynamodb-local
```

### Create the notifications table:

```bash
npm run dynamodb:create-tables
```

You should see:
```
✅ Table "user-notifications" created successfully
✅ Table is active and ready to use
```

---

## Step 2: Start All Services

```bash
# Start infrastructure (Kafka, MySQL, Redis, Elasticsearch)
npm run docker:up

# In another terminal, start the API Gateway
npm run start:api-gateway
```

Check the logs for:
```
[NotificationsKafkaConsumer] Initializing Kafka consumers for notifications...
[NotificationsKafkaConsumer] Kafka consumers initialized for notifications
[DynamoDBService] DynamoDB client initialized for table: user-notifications
```

---

## Step 3: Create Test Users

Use the API to create two test users.

### User 1 (Alice):
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "password": "password123"
  }'
```

### User 2 (Bob):
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "bob@example.com",
    "name": "Bob Jones",
    "password": "password123"
  }'
```

**Save the user IDs from the responses!**

---

## Step 4: Authenticate Users

### Login as Alice:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

**Save Alice's token**: `ALICE_TOKEN=<token>`

### Login as Bob:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "password": "password123"
  }'
```

**Save Bob's token**: `BOB_TOKEN=<token>`

---

## Step 5: Test Notifications

### Test 1: Like Notification

**Alice creates a post:**
```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Alice! This is my first post."
  }'
```

**Save Alice's post ID**: `POST_ID=<postId>`

**Bob likes Alice's post:**
```bash
curl -X PUT http://localhost:3000/posts/$POST_ID/like \
  -H "Authorization: Bearer $BOB_TOKEN"
```

**Check Alice's notifications:**
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

Expected response:
```json
{
  "notifications": [
    {
      "id": "abc-123",
      "type": "like",
      "actor": {
        "id": "<bob-id>",
        "username": "bob",
        "avatar": null
      },
      "post": {
        "id": "<post-id>",
        "text": "Hello from Alice! This is my first post."
      },
      "read": false,
      "createdAt": 1735900800000
    }
  ],
  "nextCursor": null,
  "unreadCount": 1
}
```

---

### Test 2: Follow Notification

**Note**: You'll need to implement the follow endpoint first, or manually publish a Kafka event.

**Manual Kafka event (for testing):**

Using a Kafka CLI tool or code:
```javascript
// In a test script or Node REPL
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['localhost:29092']
});

const producer = kafka.producer();

async function sendFollowEvent() {
  await producer.connect();
  await producer.send({
    topic: 'user-followed',
    messages: [
      {
        value: JSON.stringify({
          followerId: '<bob-id>',
          followerUsername: 'bob',
          followerAvatar: null,
          followeeId: '<alice-id>'
        })
      }
    ]
  });
  await producer.disconnect();
}

sendFollowEvent();
```

**Check Alice's notifications:**
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

You should now see 2 notifications (like + follow).

---

### Test 3: Mark as Read

**Get notification ID from previous response**, then:

```bash
curl -X POST http://localhost:3000/notifications/<notification-id>/read \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

Expected: `204 No Content`

**Verify it's marked as read:**
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

The notification should now have `"read": true`.

---

### Test 4: Mark All as Read

```bash
curl -X POST http://localhost:3000/notifications/read-all \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

Expected response:
```json
{
  "count": 2
}
```

---

### Test 5: Unread Count

```bash
curl -X GET http://localhost:3000/notifications/unread-count \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

Expected response (after marking all as read):
```json
{
  "count": 0
}
```

---

### Test 6: Pagination

**Generate multiple notifications** (create more likes, follows, etc.)

```bash
curl -X GET "http://localhost:3000/notifications?limit=5" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

You'll get a `nextCursor` if there are more than 5 notifications:
```json
{
  "notifications": [...],
  "nextCursor": "eyJQSyI6IlVTRVIjMTIzIiwiU0siOiJOT1RJRiMxNzM1OTAwODAwMDAwI2FiYyJ9",
  "unreadCount": 0
}
```

**Fetch next page:**
```bash
curl -X GET "http://localhost:3000/notifications?limit=5&cursor=<nextCursor>" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

---

### Test 7: Filter Unread Only

```bash
curl -X GET "http://localhost:3000/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

Expected: Only unread notifications.

---

### Test 8: Delete Notification

```bash
curl -X DELETE http://localhost:3000/notifications/<notification-id> \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

Expected: `204 No Content`

**Verify it's deleted:**
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

The deleted notification should no longer appear.

---

## Step 6: Verify in DynamoDB

### Using AWS CLI (for DynamoDB Local):

```bash
# List all notifications for Alice
aws dynamodb query \
  --table-name user-notifications \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"USER#<alice-id>"}}' \
  --endpoint-url http://localhost:8000
```

### Using DynamoDB Admin (GUI):

```bash
# Install DynamoDB Admin
npm install -g dynamodb-admin

# Start the admin UI
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin
```

Open http://localhost:8001 and browse the `user-notifications` table.

---

## Step 7: Monitor Kafka Events

### Using Redpanda Console (if using Docker Compose):

Open http://localhost:8080 and navigate to:
- Topics → `message-liked` → Messages
- Topics → `user-followed` → Messages

You should see the events being published.

### Using Kafka CLI:

```bash
# Consume like events
docker exec -it <kafka-container> kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic message-liked \
  --from-beginning
```

---

## Step 8: Check Application Logs

Look for log messages from the notifications module:

```
[NotificationsKafkaConsumer] Received like event: {...}
[NotificationsKafkaConsumer] Like notification created: post=<id>, liker=<id>
[NotificationsService] Notification created: type=like, userId=<id>, actorId=<id>
[DynamoDBService] Notification created: NOTIF#1735900800000#abc-123
```

---

## Common Issues

### Issue 1: "Cannot connect to DynamoDB"
**Solution**: Ensure DynamoDB Local is running:
```bash
docker ps | grep dynamodb
# If not running:
docker start dynamodb-local
```

### Issue 2: "Table does not exist"
**Solution**: Create the table:
```bash
npm run dynamodb:create-tables
```

### Issue 3: "No notifications appearing"
**Checklist**:
1. ✅ Kafka is running: `docker ps | grep kafka`
2. ✅ Kafka events are published: Check Redpanda Console
3. ✅ Kafka consumer is initialized: Check application logs
4. ✅ DynamoDB table exists: `npm run dynamodb:create-tables`

### Issue 4: "401 Unauthorized"
**Solution**: Ensure you're using a valid Bearer token:
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -v
```

---

## Performance Testing

### Load Test: Create 1000 Notifications

```bash
# Using a script
for i in {1..1000}; do
  curl -X PUT http://localhost:3000/posts/$POST_ID/like \
    -H "Authorization: Bearer $BOB_TOKEN" &
done
wait
```

**Check DynamoDB metrics:**
- Query latency should be < 10ms
- Write latency should be < 5ms

---

## Cleanup

```bash
# Delete DynamoDB table
npm run dynamodb:create-tables:force

# Stop DynamoDB Local
docker stop dynamodb-local
docker rm dynamodb-local

# Stop all services
npm run docker:down
```

---

## Next Steps

Once testing is successful:
1. ✅ Add WebSockets for real-time notifications
2. ✅ Implement follow/unfollow endpoints with Kafka events
3. ✅ Add reply functionality with Kafka events
4. ✅ Enable TTL on DynamoDB table (AWS Console)
5. ✅ Set up monitoring with CloudWatch (production)

---

## Automated Test Script

Save this as `test-notifications.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo "🧪 Testing Notifications System"
echo "================================"

# 1. Create users
echo -e "\n${GREEN}1. Creating test users...${NC}"
ALICE=$(curl -s -X POST $API_URL/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","name":"Alice","password":"pass123"}')
echo "Alice created: $ALICE"

BOB=$(curl -s -X POST $API_URL/users \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@test.com","name":"Bob","password":"pass123"}')
echo "Bob created: $BOB"

# 2. Login
echo -e "\n${GREEN}2. Logging in...${NC}"
ALICE_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass123"}' | jq -r '.token')
echo "Alice token: $ALICE_TOKEN"

BOB_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"pass123"}' | jq -r '.token')
echo "Bob token: $BOB_TOKEN"

# 3. Create post
echo -e "\n${GREEN}3. Alice creates a post...${NC}"
POST=$(curl -s -X POST $API_URL/posts \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test post for notifications"}')
POST_ID=$(echo $POST | jq -r '.id')
echo "Post created: $POST_ID"

# 4. Like post
echo -e "\n${GREEN}4. Bob likes Alice's post...${NC}"
curl -s -X PUT $API_URL/posts/$POST_ID/like \
  -H "Authorization: Bearer $BOB_TOKEN"
echo "Like sent"

# 5. Wait for Kafka processing
echo -e "\n${GREEN}5. Waiting for Kafka event processing...${NC}"
sleep 2

# 6. Check notifications
echo -e "\n${GREEN}6. Checking Alice's notifications...${NC}"
NOTIFS=$(curl -s -X GET $API_URL/notifications \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo $NOTIFS | jq '.'

# 7. Verify
NOTIF_COUNT=$(echo $NOTIFS | jq '.notifications | length')
if [ "$NOTIF_COUNT" -gt 0 ]; then
  echo -e "\n${GREEN}✅ SUCCESS! Found $NOTIF_COUNT notification(s)${NC}"
else
  echo -e "\n${RED}❌ FAILED! No notifications found${NC}"
fi

echo -e "\n${GREEN}Test complete!${NC}"
```

Run it:
```bash
chmod +x test-notifications.sh
./test-notifications.sh
```

---

**Happy Testing! 🚀**
