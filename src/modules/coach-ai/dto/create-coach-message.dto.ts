import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCoachMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
