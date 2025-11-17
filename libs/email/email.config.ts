import { aws } from '@apps/api-gateway/src/config/aws';
import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  ses: {
    senderEmail: aws.ses.sender,
  },
  marketing: {
    batchSize: 1000,
    sesChunkSize: 50,
    maxRetries: 3,
    dlqEnabled: true,
  },
}));
