import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AlertStatus,
  AlertStream,
  AlertType,
  normalizeAlertStreams,
  parseAlertStreams,
} from '../alert.constants';

export class QueryAlertsDto {
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @Transform(({ value }) => {
    const streams = parseAlertStreams(value);
    return streams ? normalizeAlertStreams(streams as AlertStream[]) : undefined;
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams?: AlertStream[];
}

export class BannerAlertsQueryDto {
  @Transform(({ value }) =>
    normalizeAlertStreams((parseAlertStreams(value) ?? []) as AlertStream[]),
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];
}

export class PopupAlertsQueryDto extends BannerAlertsQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
