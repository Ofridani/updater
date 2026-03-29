import { IsNotEmpty, IsString } from 'class-validator';

export class QueryAlertViewsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
