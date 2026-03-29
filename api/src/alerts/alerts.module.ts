import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertView, AlertViewSchema } from '../alert-views/schemas/alert-view.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert, AlertSchema } from './schemas/alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Alert.name,
        schema: AlertSchema,
      },
      {
        name: AlertView.name,
        schema: AlertViewSchema,
      },
    ]),
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
