import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import emailConfig from './email.config';
import { EmailService } from './email.service';
import { AwsModule } from '@apps/api-gateway/src/modules/aws/aws.module';

@Module({
  imports: [ConfigModule.forFeature(emailConfig), AwsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
