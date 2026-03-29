import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert } from '../alerts/schemas/alert.schema';
import { CreateAlertViewDto } from './dto/create-alert-view.dto';
import { AlertView } from './schemas/alert-view.schema';

interface AlertViewRecord {
  _id?: Types.ObjectId;
  alertId: Types.ObjectId;
  userId: string;
}

@Injectable()
export class AlertViewsService {
  constructor(
    @InjectModel(AlertView.name)
    private readonly alertViewModel: Model<AlertView>,
    @InjectModel(Alert.name)
    private readonly alertModel: Model<Alert>,
  ) {}

  async create(createAlertViewDto: CreateAlertViewDto) {
    const alertExists = await this.alertModel.exists({
      _id: createAlertViewDto.alertId,
    });

    if (!alertExists) {
      throw new NotFoundException(
        `Alert "${createAlertViewDto.alertId}" was not found.`,
      );
    }

    const alertView = await this.alertViewModel
      .findOneAndUpdate(
        {
          alertId: createAlertViewDto.alertId,
          userId: createAlertViewDto.userId,
        },
        {
          $setOnInsert: {
            alertId: createAlertViewDto.alertId,
            userId: createAlertViewDto.userId,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean<AlertViewRecord>()
      .exec();

    return this.serializeAlertView(alertView);
  }

  async findByUserId(userId: string) {
    const views = await this.alertViewModel
      .find({ userId })
      .sort({ _id: -1 })
      .lean<AlertViewRecord[]>()
      .exec();

    return views.map((view) => this.serializeAlertView(view));
  }

  private serializeAlertView(alertView: AlertViewRecord) {
    return {
      alertId: alertView.alertId.toString(),
      userId: alertView.userId,
    };
  }
}
