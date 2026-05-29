import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class CreateExperienceDto {
  @IsOptional()
  @IsString()
  id?: string;

  company_name: string;
  job_title: string;
  is_current: boolean;

  @Transform(({ value }) => new Date(value))
  start_date: Date;

  @Transform(({ value }) => new Date(value))
  @IsOptional()
  end_date?: Date;
}
