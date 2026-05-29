import { PaginationQuery } from '@/shared/types/pagination.query';
import { IsOptional } from 'class-validator';

export class FilterParticipationsDto extends PaginationQuery {
  @IsOptional()
  phaseId?: string;
}
