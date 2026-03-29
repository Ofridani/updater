import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    enum: AlertType,
    example: AlertType.INCIDENT,
  })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @ApiPropertyOptional({
    enum: AlertStatus,
    example: AlertStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({
    example: 'user-42',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @ApiPropertyOptional({
    enum: AlertStream,
    isArray: true,
    example: [AlertStream.EARTH],
    description:
      'Accepts repeated query params, comma-separated values, or a JSON array string.',
  })
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
  @ApiProperty({
    enum: AlertStream,
    isArray: true,
    example: [AlertStream.EARTH],
    description:
      'Accepts repeated query params, comma-separated values, or a JSON array string.',
  })
  @Transform(({ value }) =>
    normalizeAlertStreams((parseAlertStreams(value) ?? []) as AlertStream[]),
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];
}

export class PopupAlertsQueryDto extends BannerAlertsQueryDto {
  @ApiProperty({
    example: 'user-42',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
