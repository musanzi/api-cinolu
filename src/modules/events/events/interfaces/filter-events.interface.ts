import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterEventsInterface extends PaginationInterface {
  q?: string;
  categories?: string[] | string;
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
