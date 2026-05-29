import { IsOptional, IsUUID } from 'class-validator';

export class ParticipateEventDto {
  @IsOptional()
  @IsUUID()
  venture_id?: string;
}
