import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateAlertViewDto {
  @IsMongoId()
  alertId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}
