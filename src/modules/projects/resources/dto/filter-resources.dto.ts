import { PaginationQuery } from '@/core/types/pagination.query';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ResourceCategory } from '../entities/resource.entity';

export class FilterResourcesDto extends PaginationQuery {
  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

  @IsOptional()
  @IsString()
  tags?: string;
}
