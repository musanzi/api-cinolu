import { PaginationInterface } from '@/modules/database/interfaces/pagination.interface';

export interface FilterRolesInterface extends PaginationInterface {
  q?: string;
}
