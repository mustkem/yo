import { Controller, Get } from '@nestjs/common';
import { PostServiceService } from './post-service.service';

@Controller()
export class PostServiceController {
  constructor(private readonly postServiceService: PostServiceService) {}

  @Get()
  getHello(): string {
    return this.postServiceService.getHello();
  }
}
