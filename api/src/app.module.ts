import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlertViewsModule } from './alert-views/alert-views.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/updater',
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'component', 'dist'),
      serveRoot: '/components',
    }),
    AlertsModule,
    AlertViewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
