import { PaginationInterface } from '@/shared/interfaces/pagination.interface';
import { ResourceCategory } from '../entities/resource.entity';

export interface FilterResourcesInterface extends PaginationInterface {
  q?: string;
  category?: ResourceCategory;
}
