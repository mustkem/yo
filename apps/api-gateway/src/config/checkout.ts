import { domain } from './domain';
import { env } from './env';

export const checkout = {
  secretKeyArn: process.env.CKO_SECRET_KEY_ARN || 'mock-cko-secret-key-arn',
  publicKeyArn: process.env.CKO_PUBLIC_KEY_ARN || 'mock-cko-public-key-arn',
  successUrl: env.isLocal
    ? `https://local.yo.xyz/api/purchase/success`
    : `https://${domain.webDomain}/api/purchase/success`,
  failureUrl: env.isLocal
    ? `https://local.yo.xyz/api/purchase/fail`
    : `https://${domain.webDomain}/api/purchase/fail`,
  currency: 'USD',
  decimals: 100,
  processingChannelId: {
    comics: process.env.CKO_COMICS_PROCESSING_CHANNEL_ID,
    default: process.env.CKO_DEFAULT_PROCESSING_CHANNEL_ID,
  },
  webhook: {
    authKey: process.env.CKO_WEBHOOK_AUTH_KEY || 'mock-auth-key',
    secretKey: process.env.CKO_WEBHOOK_SECRET_KEY || 'mock-secret-key',
    ipList: env.isProduction ? ['1.1.1.1.1'] : ['2.2.2.2.2'],
  },
};
