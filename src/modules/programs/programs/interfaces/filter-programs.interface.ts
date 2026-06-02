import { PaginationInterface } from '@/modules/database/interfaces/pagination.interface';

export interface FilterProgramsInterface extends PaginationInterface {
  q?: string;
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
