import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api.module';
import { AppConfigModule } from 'libs/config/src';
import { DatabaseModule } from './modules/commons/db.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
