import { PaginationQuery } from '@/shared/types/pagination.query';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class FilterEventsDto extends PaginationQuery {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsIn(['all', 'published', 'drafts', 'highlighted'])
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
