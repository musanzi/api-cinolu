import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  place: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  context?: string;

  @IsOptional()
  objectives?: string;

  @IsOptional()
  duration_hours?: number;

  @IsOptional()
  selection_criteria?: string;

  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  started_at: Date;

  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  ended_at: Date;

  @IsOptional()
  event_manager?: string;

  @IsNotEmpty()
  program: string;

  @IsNotEmpty()
  categories: string[];
}
