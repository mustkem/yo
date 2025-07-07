import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  public get kafka() {
    return {
      broker: this.config.get<string>('KAFKA_BROKER'),
    };
  }

  public get aws() {
    return {
      bucket: this.config.get<string>('AWS_S3_BUCKET_NAME'),
      region: this.config.get<string>('AWS_REGION', ''),
      accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
    };
  }

  public get root() {
    return {
      kafka: this.kafka,
      aws: this.aws,
    };
  }
}
