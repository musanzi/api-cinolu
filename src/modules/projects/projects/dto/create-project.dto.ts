import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  context?: string;

  @IsOptional()
  objectives?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? +value : null))
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
  project_manager?: string;

  @IsNotEmpty()
  program: string;

  @IsArray()
  @IsNotEmpty()
  categories: string[];
}
