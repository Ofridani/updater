import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Alert } from '../../alerts/schemas/alert.schema';

export type AlertViewDocument = HydratedDocument<AlertView>;

@Schema({
  collection: 'alert-views',
  versionKey: false,
})
export class AlertView {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: Alert.name,
    required: true,
  })
  alertId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  userId!: string;
}

export const AlertViewSchema = SchemaFactory.createForClass(AlertView);

AlertViewSchema.index(
  {
    alertId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);
