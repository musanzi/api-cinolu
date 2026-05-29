import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateParticipationReviewDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  notifyParticipant?: boolean;
}
