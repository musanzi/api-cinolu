import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ParticipationReviewDto {
  @IsUUID()
  phaseId: string;

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
