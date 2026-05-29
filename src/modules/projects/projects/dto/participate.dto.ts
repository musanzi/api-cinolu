import { IsUUID } from 'class-validator';

export class ParticipateProjectDto {
  @IsUUID()
  ventureId?: string;
}
