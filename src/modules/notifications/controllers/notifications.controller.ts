import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { FilterNotificationsDto } from '../dto/filter-notifications.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { Notification } from '../entities/notification.entity';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('project/:projectId')
  @Rbac({ resource: 'projects', action: 'read' })
  findAllByProject(
    @Param('projectId') projectId: string,
    @Query() query: FilterNotificationsDto
  ): Promise<[Notification[], number]> {
    return this.notificationsService.findByProject(projectId, query);
  }

  @Patch('id/:notificationId')
  @Rbac({ resource: 'notifications', action: 'update' })
  update(@Param('notificationId') notificationId: string, @Body() dto: UpdateNotificationDto): Promise<Notification> {
    return this.notificationsService.update(notificationId, dto);
  }

  @Delete('id/:notificationId')
  @Rbac({ resource: 'notifications', action: 'delete' })
  remove(@Param('notificationId') notificationId: string): Promise<void> {
    return this.notificationsService.remove(notificationId);
  }
}
