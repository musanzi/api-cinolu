import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterProjectsInterface extends PaginationInterface {
  q?: string;
  categories?: string[] | string;
  status?: 'past' | 'current' | 'future';
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
