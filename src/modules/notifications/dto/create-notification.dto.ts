import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  body: string;

  @IsOptional()
  phase_id?: string;

  @IsOptional()
  @IsBoolean()
  notify_mentors?: boolean | null;

  @IsOptional()
  @IsBoolean()
  notify_staff?: boolean | null;
}
