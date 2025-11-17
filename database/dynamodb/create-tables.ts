import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CreateTableCommand,
  DescribeTableCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT, // For local development
  credentials: process.env.DYNAMODB_ENDPOINT
    ? {
        accessKeyId: 'local',
        secretAccessKey: 'local',
      }
    : undefined,
});

const TABLE_NAME = process.env.DYNAMODB_NOTIFICATIONS_TABLE || 'user-notifications';

/**
 * Create DynamoDB tables for notifications
 */
async function createTables() {
  console.log('🚀 Creating DynamoDB tables...');
  console.log(`Table name: ${TABLE_NAME}`);
  console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS DynamoDB'}`);
  console.log('─'.repeat(50));

  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      console.log(`⚠️  Table "${TABLE_NAME}" already exists`);

      const args = process.argv.slice(2);
      if (args.includes('--force') || args.includes('-f')) {
        console.log('🗑️  Deleting existing table...');
        await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
        console.log('⏳ Waiting for table to be deleted...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } else {
        console.log('💡 Use --force or -f flag to recreate the table');
        return;
      }
    } catch (error) {
      // Table doesn't exist, continue with creation
      console.log(`✅ Table "${TABLE_NAME}" does not exist, creating...`);
    }

    // Create user-notifications table
    const createTableCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },  // Partition key (USER#<userId>)
        { AttributeName: 'SK', KeyType: 'RANGE' }, // Sort key (NOTIF#<timestamp>#<notifId>)
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing (no provisioning needed)
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES', // Capture full items for streams
      },
      Tags: [
        { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
        { Key: 'Service', Value: 'notifications' },
      ],
    });

    await client.send(createTableCommand);
    console.log(`✅ Table "${TABLE_NAME}" created successfully`);

    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await waitForTableActive(TABLE_NAME);
    console.log('✅ Table is active and ready to use');

    // Display table info
    console.log('\n' + '─'.repeat(50));
    console.log('📋 Table Information:');
    console.log(`   Name: ${TABLE_NAME}`);
    console.log(`   Partition Key: PK (String) - USER#<userId>`);
    console.log(`   Sort Key: SK (String) - NOTIF#<timestamp>#<notifId>`);
    console.log(`   Billing Mode: PAY_PER_REQUEST`);
    console.log(`   Streams: Enabled (NEW_AND_OLD_IMAGES)`);
    console.log(`   TTL: Configure manually via AWS Console (attribute: ttl)`);
    console.log('─'.repeat(50));

    console.log('\n✅ DynamoDB tables created successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. For local development: Install DynamoDB Local');
    console.log('      Docker: docker run -p 8000:8000 amazon/dynamodb-local');
    console.log('   2. Enable TTL on the table (attribute: ttl)');
    console.log('      AWS Console → DynamoDB → Tables → user-notifications → Additional settings → TTL');
    console.log('   3. Start your application: npm run start:api-gateway');
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    throw error;
  }
}

/**
 * Wait for table to become active
 */
async function waitForTableActive(tableName: string, maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await client.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      if (response.Table?.TableStatus === 'ACTIVE') {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error(`Table ${tableName} did not become active after ${maxAttempts} attempts`);
}

// Run the script
createTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
