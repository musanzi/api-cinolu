import { Type, Transform } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { DeliverableDto } from '../deliverables/dto/deliverable.dto';

export class CreatePhaseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  started_at: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  ended_at: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentors?: string[];
}
