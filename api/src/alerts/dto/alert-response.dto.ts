import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertStatus, AlertStream, AlertType } from '../alert.constants';

export class AlertThemeResponseDto {
  @ApiProperty({
    example: '#b42318',
  })
  bannerColor!: string;

  @ApiProperty({
    example: '#ffffff',
  })
  bannerTextColor!: string;

  @ApiProperty({
    example: '#fef3f2',
  })
  popUpColor!: string;

  @ApiProperty({
    example: '#7a271a',
  })
  popUpTextColor!: string;
}

export class AlertResponseDto {
  @ApiProperty({
    example: '67e76af4f7ddf8acac620001',
  })
  _id!: string;

  @ApiProperty({
    enum: AlertType,
    example: AlertType.INCIDENT,
  })
  type!: AlertType;

  @ApiProperty({
    example: 'Payments are delayed',
  })
  title!: string;

  @ApiProperty({
    example: 'Some users may see delayed payment confirmations.',
  })
  impact!: string;

  @ApiPropertyOptional({
    example: 'We are investigating elevated latency in the payment pipeline.',
  })
  description?: string;

  @ApiProperty({
    enum: AlertStream,
    isArray: true,
    example: [AlertStream.EARTH, AlertStream.AIR],
  })
  streams!: AlertStream[];

  @ApiProperty({
    type: AlertThemeResponseDto,
  })
  theme!: AlertThemeResponseDto;

  @ApiProperty({
    example: '2026-03-29T02:00:00.000Z',
  })
  publishDate!: Date;

  @ApiProperty({
    enum: [...Object.values(AlertStatus), null],
    nullable: true,
    example: AlertStatus.ACTIVE,
  })
  status!: AlertStatus | null;

  @ApiProperty({
    nullable: true,
    example: null,
  })
  resolution_incident_id!: string | null;

  @ApiPropertyOptional({
    example: false,
  })
  viewed?: boolean;
}
