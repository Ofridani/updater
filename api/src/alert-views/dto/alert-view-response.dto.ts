import { ApiProperty } from '@nestjs/swagger';

export class AlertViewResponseDto {
  @ApiProperty({
    example: '67e76af4f7ddf8acac620001',
  })
  alertId!: string;

  @ApiProperty({
    example: 'user-42',
  })
  userId!: string;
}
