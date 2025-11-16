import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { AppConfigModule } from 'libs/config/src';
import { DynamoDBService } from './dynamodb.service';

@Module({
  imports: [AppConfigModule],
  providers: [S3Service, DynamoDBService],
  exports: [S3Service, DynamoDBService],
})
export class AwsModule {}
