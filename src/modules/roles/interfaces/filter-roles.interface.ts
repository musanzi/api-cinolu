import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterRolesInterface extends PaginationInterface {
  q?: string;
}
