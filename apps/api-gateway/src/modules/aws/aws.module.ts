import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { AppConfigModule } from 'libs/config/src';
import { DynamoDBService } from './dynamodb.service';
import { AwsService } from './aws.service';

@Module({
  imports: [AppConfigModule],
  providers: [AwsService, S3Service, DynamoDBService],
  exports: [AwsService, S3Service, DynamoDBService],
})
export class AwsModule {}
