import { registerAs } from '@nestjs/config'
import { aws } from '~config/aws'

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
}))
