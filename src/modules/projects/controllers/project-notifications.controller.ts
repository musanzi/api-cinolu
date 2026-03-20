import { Body, Controller, Param, Post } from '@nestjs/common';
import { CurrentUser, Rbac } from '@musanzi/nestjs-session-auth';
import { CreateNotificationDto } from '@/modules/notifications/dto/create-notification.dto';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { User } from '@/modules/users/entities/user.entity';
import { ProjectNotificationService } from '../services/project-notifications.service';

@Controller('projects')
export class ProjectNotificationsController {
  constructor(private readonly notificationService: ProjectNotificationService) {}

  @Post('id/:projectId/notifications')
  @Rbac({ resource: 'projects', action: 'update' })
  createNotification(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateNotificationDto
  ): Promise<Notification> {
    return this.notificationService.create(projectId, user, dto);
  }

  @Post('notifications/:notificationId/send')
  @Rbac({ resource: 'projects', action: 'update' })
  send(@Param('notificationId') notificationId: string): Promise<Notification> {
    return this.notificationService.send(notificationId);
  }
}
