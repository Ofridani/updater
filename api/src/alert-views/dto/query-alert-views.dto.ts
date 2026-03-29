import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueryAlertViewsDto {
  @ApiProperty({
    example: 'user-42',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
