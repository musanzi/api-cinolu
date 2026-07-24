import { NotificationStatus } from '../types/notification-status.enum';
import { PaginationInterface } from '@/shared/interfaces/pagination.interface';

export interface FilterNotificationsInterface extends PaginationInterface {
  q?: string;
  phaseId?: string;
  status?: NotificationStatus;
}
