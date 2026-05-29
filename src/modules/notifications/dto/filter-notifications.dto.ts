import { NotificationStatus } from '../types/notification-status.enum';
import { PaginationQuery } from '@/shared/types/pagination.query';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class FilterNotificationsDto extends PaginationQuery {
  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
