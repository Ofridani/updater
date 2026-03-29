import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    description: 'Override color for the banner background.',
    example: '#b42318',
  })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  bannerColor?: string;

  @ApiPropertyOptional({
    description: 'Override color for the banner text.',
    example: '#ffffff',
  })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  bannerTextColor?: string;

  @ApiPropertyOptional({
    description: 'Override color for the popup background.',
    example: '#fef3f2',
  })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  popUpColor?: string;

  @ApiPropertyOptional({
    description: 'Override color for the popup text.',
    example: '#7a271a',
  })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  popUpTextColor?: string;
}

export class CreateAlertDto {
  @ApiProperty({
    enum: AlertType,
    example: AlertType.INCIDENT,
  })
  @IsEnum(AlertType)
  type!: AlertType;

  @ApiProperty({
    example: 'Payments are delayed',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Some users may see delayed payment confirmations.',
  })
  @IsString()
  @IsNotEmpty()
  impact!: string;

  @ApiPropertyOptional({
    example: 'We are investigating elevated latency in the payment pipeline.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    type: AlertThemeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlertThemeDto)
  theme?: AlertThemeDto;

  @ApiProperty({
    enum: AlertStream,
    isArray: true,
    example: [AlertStream.EARTH],
    description: 'One or more updater system streams that own this alert.',
  })
  @Transform(({ value }) =>
    normalizeAlertStreams((parseAlertStreams(value) ?? []) as AlertStream[]),
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @ApiPropertyOptional({
    enum: AlertStatus,
    description:
      'Optional on create. Incidents are forced to active, retroIncidents to resolved, and resolutions to null.',
    example: AlertStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({
    description: 'Required only when type is resolution.',
    example: '67e76af4f7ddf8acac620001',
  })
  @IsOptional()
  @IsMongoId()
  resolution_incident_id?: string;
}
