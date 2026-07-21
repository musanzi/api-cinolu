import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { FilterNotificationsInterface } from '../interfaces/filter-notifications.interface';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { Notification } from '../entities/notification.entity';
import { NotificationsService } from '../services/notifications.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('project/:projectId')
  findAllByProject(
    @Param('projectId') projectId: string,
    @Query() query: FilterNotificationsInterface
  ): Promise<[Notification[], number]> {
    return this.notificationsService.findByProject(projectId, query);
  }

  @Patch('id/:notificationId')
  @HasRoles([Roles.STAFF])
  update(@Param('notificationId') notificationId: string, @Body() dto: UpdateNotificationDto): Promise<Notification> {
    return this.notificationsService.update(notificationId, dto);
  }

  @Delete('id/:notificationId')
  @HasRoles([Roles.STAFF])
  remove(@Param('notificationId') notificationId: string): Promise<void> {
    return this.notificationsService.remove(notificationId);
  }
}
