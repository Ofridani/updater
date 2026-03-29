import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertViewsController } from './alert-views.controller';
import { AlertViewsService } from './alert-views.service';
import { AlertView, AlertViewSchema } from './schemas/alert-view.schema';
import { Alert, AlertSchema } from '../alerts/schemas/alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AlertView.name,
        schema: AlertViewSchema,
      },
      {
        name: Alert.name,
        schema: AlertSchema,
      },
    ]),
  ],
  controllers: [AlertViewsController],
  providers: [AlertViewsService],
  exports: [AlertViewsService],
})
export class AlertViewsModule {}
