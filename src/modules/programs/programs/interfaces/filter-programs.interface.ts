import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterProgramsInterface extends PaginationInterface {
  q?: string;
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
