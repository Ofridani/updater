import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { AlertStatus, AlertStream, AlertType } from '../alert.constants';

export type AlertDocument = HydratedDocument<Alert>;

@Schema({
  _id: false,
})
export class AlertTheme {
  @Prop()
  bannerColor?: string;

  @Prop()
  bannerTextColor?: string;

  @Prop()
  popUpColor?: string;

  @Prop()
  popUpTextColor?: string;
}

export const AlertThemeSchema = SchemaFactory.createForClass(AlertTheme);

@Schema({
  collection: 'alerts',
  versionKey: false,
})
export class Alert {
  @Prop({
    required: true,
    enum: Object.values(AlertType),
  })
  type!: AlertType;

  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
  })
  impact!: string;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop({
    type: AlertThemeSchema,
    required: false,
  })
  theme?: AlertTheme;

  @Prop({
    type: [String],
    enum: Object.values(AlertStream),
    required: true,
  })
  streams!: AlertStream[];

  @Prop({
    type: Date,
    default: Date.now,
    immutable: true,
  })
  publishDate!: Date;

  @Prop({
    type: String,
    enum: Object.values(AlertStatus),
    default: null,
  })
  status!: AlertStatus | null;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: Alert.name,
    default: null,
  })
  resolution_incident_id!: Types.ObjectId | null;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

AlertSchema.index({
  streams: 1,
  type: 1,
  status: 1,
  publishDate: -1,
});
