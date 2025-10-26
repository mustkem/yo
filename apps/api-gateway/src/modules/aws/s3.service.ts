import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from 'libs/config/src';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: AppConfigService) {
    this.bucket = this.config.aws.bucket; // 👈 this will now work

    console.log('[S3Service] Bucket:', this.bucket);

    this.s3Client = new S3Client({
      region: this.config.aws.region,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey,
      },
    });
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    console.log('this.bucket', this.bucket);
    console.log('[S3Service] Bucket name:2 ', this.bucket);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async getViewUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }
}
