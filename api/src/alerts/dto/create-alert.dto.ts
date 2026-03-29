import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  AlertStatus,
  AlertStream,
  AlertType,
  normalizeAlertStreams,
  parseAlertStreams,
} from '../alert.constants';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export class AlertThemeDto {
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  bannerColor?: string;

  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  bannerTextColor?: string;

  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  popUpColor?: string;

  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  popUpTextColor?: string;
}

export class CreateAlertDto {
  @IsEnum(AlertType)
  type!: AlertType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  impact!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlertThemeDto)
  theme?: AlertThemeDto;

  @Transform(({ value }) =>
    normalizeAlertStreams((parseAlertStreams(value) ?? []) as AlertStream[]),
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsMongoId()
  resolution_incident_id?: string;
}
