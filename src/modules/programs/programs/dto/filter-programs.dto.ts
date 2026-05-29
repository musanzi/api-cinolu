import { PaginationQuery } from '@/shared/types/pagination.query';
import { IsIn, IsOptional } from 'class-validator';

export class FilterProgramsDto extends PaginationQuery {
  @IsOptional()
  @IsIn(['all', 'published', 'drafts', 'highlighted'])
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
