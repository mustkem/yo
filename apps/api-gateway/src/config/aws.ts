import { checkout } from './checkout';
import { env } from './env';

export const aws = {
  region: process.env.AWS_REGION || 'us-east-1',
  pinpoint: {
    applicationId: process.env.PINPOINT_APPLICATION_ID || 'test-application-id',
  },
  kms: {
    fusionAuthPasswordKeyId: process.env.FA_PASS_KMS_KEY_ID as string,
  },
  dynamodb: {
    endpoint:
      process.env.AWS_DYNAMODB_ENDPOINT ||
      (env.isLocal || env.isTest ? 'http://localhost:8000' : undefined),
    loginHistory: {
      tableName: process.env.LOGIN_HISTORY_DYNAMODB_TABLE || 'login-history',
      indexUserIdClientId:
        process.env.LOGIN_HISTORY_CLIENT_ID_INDEX || 'userId-clientId-index',
      indexUserIdCreatedAt:
        process.env.LOGIN_HISTORY_CREATED_AT_INDEX || 'userId-createdAt-index',
    },
  },
  entityDropStateMachine: {
    arn: process.env.ENTITY_DROP_STATE_MACHINE_ARN || 'localhost',
  },
  s3: {
    endpoint:
      process.env.AWS_S3_ENDPOINT ||
      (env.isLocal || env.isTest ? 'http://localhost:9000' : undefined),
    // Default key of docker image scireum/s3-ninja is EXAMPLE
    accessKeyId:
      process.env.AWS_S3_ACCESS_KEY ||
      (env.isLocal || env.isTest ? 'EXAMPLE' : undefined),
    // Default secret key of docker image scireum/s3-ninja is wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    secretAccessKey:
      process.env.AWS_S3_SECRET_KEY ||
      (env.isLocal || env.isTest ? 'none' : undefined),
    image: {
      bucketName: process.env.S3_IMAGE_BUCKET || 'test',
    },
    adminAsset: {
      bucketName: process.env.S3_ADMIN_ASSET_BUCKET || 'test',
    },
    adminImage: {
      bucketName: process.env.S3_ADMIN_IMAGE_BUCKET || 'test',
    },
  },
  cloudfront: {
    image: {
      domain:
        process.env.CLOUDFRONT_IMAGE_DOMAIN || 'http://localhost:9000/ui/test',
    },
    adminImage: {
      domain:
        process.env.CLOUDFRONT_ADMIN_IMAGE_DOMAIN ||
        'http://localhost:9000/ui/test',
    },
    adminAsset: {
      domain:
        process.env.CLOUDFRONT_ADMIN_ASSET_DOMAIN ||
        'http://localhost:9000/ui/test',
    },
  },
  ses: {
    sender: `noreply@${env.isProduction ? '' : `${env.currentEnv}.`}yo.xyz`,
    template: {
      welcomeEmail:
        process.env.SES_WELCOME_EMAIL_TEMPLATE || 'WelcomeEmailTemplate',
      emailConfirmation:
        process.env.SES_EMAIL_CONFIRMATION_TEMPLATE ||
        'EmailConfirmationTemplate',
      forgotPassword:
        process.env.SES_FORGOT_PASSWORD_TEMPLATE || 'ForgotPasswordTemplate',

      purchaseSuccessful:
        process.env.SES_PURCHASE_SUCCESSFUL || 'PurchaseSuccessful',
    },
  },
  secretManager: {
    checkout: {
      secretKeyArn: checkout.secretKeyArn,
      publicKeyArn: checkout.publicKeyArn,
    },
  },
};
