import { PaginationInterface } from '@/modules/database/interfaces/pagination.interface';

export interface FilterUsersInterface extends PaginationInterface {
  q?: string;
}
