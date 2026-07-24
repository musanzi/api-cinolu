import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterUsersInterface extends PaginationInterface {
  q?: string;
}
