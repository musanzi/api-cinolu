import { PaginationInterface } from '@/modules/database/interfaces/pagination.interface';
import { ResourceCategory } from '../entities/resource.entity';

export interface FilterResourcesInterface extends PaginationInterface {
  q?: string;
  category?: ResourceCategory;
}
