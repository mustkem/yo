import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB Configuration
 *
 * Creates a DynamoDB client with document client wrapper for easier JSON operations
 */
export const createDynamoDBClient = () => {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT, // For local development with DynamoDB Local
    credentials: process.env.DYNAMODB_ENDPOINT
      ? {
          // Local development credentials (not used but required)
          accessKeyId: 'local',
          secretAccessKey: 'local',
        }
      : undefined, // Use default AWS credentials in production
  });

  // Document client marshals/unmarshals JavaScript objects to DynamoDB format
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true, // Remove undefined values from objects
      convertEmptyValues: false, // Don't convert empty strings to null
    },
    unmarshallOptions: {
      wrapNumbers: false, // Return numbers as JavaScript numbers (not BigInt)
    },
  });

  return docClient;
};

/**
 * DynamoDB Table Names
 */
export const DYNAMODB_TABLES = {
  USER_NOTIFICATIONS: process.env.DYNAMODB_NOTIFICATIONS_TABLE || 'user-notifications',
} as const;
