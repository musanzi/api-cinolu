import { PaginationInterface } from '@/modules/database/interfaces/pagination.interface';

export interface FilterParticipationsInterface extends PaginationInterface {
  q?: string;
  phaseId?: string;
}
