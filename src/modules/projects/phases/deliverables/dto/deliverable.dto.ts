import { IsOptional, IsString, IsUUID } from 'class-validator';

export class DeliverableDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
