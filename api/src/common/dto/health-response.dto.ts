import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'updater-api',
  })
  name!: string;

  @ApiProperty({
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({
    example: '/components/component.es.js',
  })
  componentBundle!: string;
}
