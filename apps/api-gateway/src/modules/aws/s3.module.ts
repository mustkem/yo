import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { AppConfigModule } from 'libs/config/src';

@Module({
  imports: [AppConfigModule],
  providers: [S3Service],
  exports: [S3Service], // 👈 important so other modules can use it
})
export class S3Module {}
