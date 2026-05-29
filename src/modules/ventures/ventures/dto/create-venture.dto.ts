import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class CreateVentureDto {
  name: string;
  description: string;
  problem_solved: string;
  target_market: string;

  @IsOptional()
  email: string;

  @IsOptional()
  phone_number: string;

  @IsOptional()
  website: string;

  @IsOptional()
  linkedin_url: string;

  @IsOptional()
  sector: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  founded_at: Date;

  @IsOptional()
  location: string;

  @IsOptional()
  stage: string;
}
