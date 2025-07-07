import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './commons/db.module';
import { ApiModule } from './api.module';
import { AppConfigModule } from 'libs/config/src';

@Module({
  imports: [AppConfigModule, DatabaseModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
