import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlertViewsModule } from './alert-views/alert-views.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AlertsModule,
    AlertViewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

