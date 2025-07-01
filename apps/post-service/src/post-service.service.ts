import { Injectable } from '@nestjs/common';

@Injectable()
export class PostServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
