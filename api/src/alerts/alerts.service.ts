import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertView } from '../alert-views/schemas/alert-view.schema';
import {
  AlertStatus,
  AlertStream,
  AlertThemePalette,
  AlertType,
  haveSameAlertStreams,
  normalizeAlertStreams,
  resolveAlertTheme,
} from './alert.constants';
import { CreateAlertDto } from './dto/create-alert.dto';
import { QueryAlertsDto } from './dto/query-alerts.dto';
import { Alert } from './schemas/alert.schema';

interface AlertRecord {
  _id: Types.ObjectId;
  type: AlertType;
  title: string;
  impact: string;
  description?: string;
  theme?: Partial<AlertThemePalette> | null;
  streams: AlertStream[];
  publishDate: Date;
  status: AlertStatus | null;
  resolution_incident_id: Types.ObjectId | null;
}

export interface SerializedAlert {
  _id: string;
  type: AlertType;
  title: string;
  impact: string;
  description?: string;
  theme: AlertThemePalette;
  streams: AlertStream[];
  publishDate: Date;
  status: AlertStatus | null;
  resolution_incident_id: string | null;
  viewed?: boolean;
}

type AlertFilter = Record<string, unknown>;

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<Alert>,
    @InjectModel(AlertView.name)
    private readonly alertViewModel: Model<AlertView>,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<SerializedAlert> {
    const payload = await this.buildCreatePayload(createAlertDto);
    const createdAlert = await this.alertModel.create(payload);

    if (
      createdAlert.type === AlertType.RESOLUTION &&
      createdAlert.resolution_incident_id
    ) {
      await this.alertModel.findByIdAndUpdate(createdAlert.resolution_incident_id, {
        status: AlertStatus.RESOLVED,
      });
    }

    return this.serializeAlert(createdAlert.toObject() as AlertRecord);
  }

  async findAll(query: QueryAlertsDto): Promise<SerializedAlert[]> {
    const filter: AlertFilter = {};

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.streams && query.streams.length > 0) {
      filter.streams = { $in: query.streams };
    }

    const alerts = await this.alertModel
      .find(filter)
      .sort({ publishDate: -1 })
      .lean<AlertRecord[]>()
      .exec();

    const viewedIds = query.userId
      ? await this.findViewedAlertIdSet(query.userId)
      : undefined;

    return alerts.map((alert) =>
      this.serializeAlert(
        alert,
        viewedIds ? viewedIds.has(alert._id.toString()) : undefined,
      ),
    );
  }

  async findOne(id: string): Promise<SerializedAlert> {
    const alert = await this.alertModel.findById(id).lean<AlertRecord | null>().exec();

    if (!alert) {
      throw new NotFoundException(`Alert "${id}" was not found.`);
    }

    return this.serializeAlert(alert);
  }

  async findBannerAlerts(streams: AlertStream[]): Promise<SerializedAlert[]> {
    const alerts = await this.alertModel
      .find({
        type: AlertType.INCIDENT,
        status: AlertStatus.ACTIVE,
        streams: {
          $in: streams,
        },
      })
      .sort({ publishDate: -1 })
      .lean<AlertRecord[]>()
      .exec();

    return alerts.map((alert) => this.serializeAlert(alert));
  }

  async findPopupAlerts(
    userId: string,
    streams: AlertStream[],
  ): Promise<SerializedAlert[]> {
    const viewedIds = await this.findViewedObjectIds(userId);
    const currentAlertFilter = this.buildCurrentAlertFilter(streams);
    const filter: AlertFilter = {
      ...currentAlertFilter,
    };

    if (viewedIds.length > 0) {
      filter._id = { $nin: viewedIds };
    }

    const alerts = await this.alertModel
      .find(filter)
      .sort({ publishDate: -1 })
      .lean<AlertRecord[]>()
      .exec();

    return alerts.map((alert) => this.serializeAlert(alert, false));
  }

  private async buildCreatePayload(createAlertDto: CreateAlertDto) {
    switch (createAlertDto.type) {
      case AlertType.INCIDENT:
        return this.buildIncidentPayload(createAlertDto);
      case AlertType.RETRO_INCIDENT:
        return this.buildRetroIncidentPayload(createAlertDto);
      case AlertType.RESOLUTION:
        return this.buildResolutionPayload(createAlertDto);
      default:
        throw new BadRequestException('Unsupported alert type.');
    }
  }

  private buildIncidentPayload(createAlertDto: CreateAlertDto) {
    if (
      createAlertDto.status &&
      createAlertDto.status !== AlertStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Incident alerts must be created with an active status.',
      );
    }

    if (createAlertDto.resolution_incident_id) {
      throw new BadRequestException(
        'Incident alerts cannot define resolution_incident_id.',
      );
    }

    return {
      ...createAlertDto,
      streams: normalizeAlertStreams(createAlertDto.streams),
      status: AlertStatus.ACTIVE,
      resolution_incident_id: null,
    };
  }

  private buildRetroIncidentPayload(createAlertDto: CreateAlertDto) {
    if (
      createAlertDto.status &&
      createAlertDto.status !== AlertStatus.RESOLVED
    ) {
      throw new BadRequestException(
        'retroIncident alerts can only be published as resolved.',
      );
    }

    if (createAlertDto.resolution_incident_id) {
      throw new BadRequestException(
        'retroIncident alerts cannot define resolution_incident_id.',
      );
    }

    return {
      ...createAlertDto,
      streams: normalizeAlertStreams(createAlertDto.streams),
      status: AlertStatus.RESOLVED,
      resolution_incident_id: null,
    };
  }

  private async buildResolutionPayload(createAlertDto: CreateAlertDto) {
    if (createAlertDto.status) {
      throw new BadRequestException(
        'Resolution alerts cannot define a status. The value is always null.',
      );
    }

    if (!createAlertDto.resolution_incident_id) {
      throw new BadRequestException(
        'Resolution alerts must provide resolution_incident_id.',
      );
    }

    const incident = await this.alertModel.findById(createAlertDto.resolution_incident_id);

    if (!incident) {
      throw new NotFoundException(
        `Incident "${createAlertDto.resolution_incident_id}" was not found.`,
      );
    }

    if (incident.type !== AlertType.INCIDENT) {
      throw new BadRequestException(
        'Resolution alerts can only point to incident alerts.',
      );
    }

    const existingResolution = await this.alertModel.exists({
      type: AlertType.RESOLUTION,
      resolution_incident_id: incident._id,
    });

    if (existingResolution) {
      throw new ConflictException(
        `Incident "${incident.id}" already has a resolution alert.`,
      );
    }

    if (!haveSameAlertStreams(createAlertDto.streams, incident.streams)) {
      throw new BadRequestException(
        'Resolution alerts must use the same streams as the linked incident.',
      );
    }

    return {
      ...createAlertDto,
      streams: normalizeAlertStreams(createAlertDto.streams),
      status: null,
    };
  }

  private buildCurrentAlertFilter(streams: AlertStream[]): AlertFilter {
    return {
      streams: {
        $in: streams,
      },
      $or: [
        {
          type: AlertType.INCIDENT,
          status: AlertStatus.ACTIVE,
        },
        {
          type: AlertType.RESOLUTION,
        },
        {
          type: AlertType.RETRO_INCIDENT,
        },
      ],
    };
  }

  private async findViewedAlertIdSet(userId: string): Promise<Set<string>> {
    const viewIds = await this.findViewedObjectIds(userId);
    return new Set(viewIds.map((viewId) => viewId.toString()));
  }

  private async findViewedObjectIds(userId: string): Promise<Types.ObjectId[]> {
    const views = await this.alertViewModel
      .find({ userId })
      .select({ alertId: 1, _id: 0 })
      .lean<{ alertId: Types.ObjectId }[]>()
      .exec();

    return views.map((view) => view.alertId);
  }

  private serializeAlert(alert: AlertRecord, viewed?: boolean): SerializedAlert {
    return {
      _id: alert._id.toString(),
      type: alert.type,
      title: alert.title,
      impact: alert.impact,
      description: alert.description,
      theme: resolveAlertTheme(alert.type, alert.theme),
      streams: alert.streams,
      publishDate: alert.publishDate,
      status: alert.status ?? null,
      resolution_incident_id: alert.resolution_incident_id
        ? alert.resolution_incident_id.toString()
        : null,
      ...(viewed === undefined ? {} : { viewed }),
    };
  }
}
