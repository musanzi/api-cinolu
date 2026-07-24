import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterParticipationsInterface extends PaginationInterface {
  q?: string;
  phaseId?: string;
}
