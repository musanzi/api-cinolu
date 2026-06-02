import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateNotificationDto } from '../../../notifications/dto/create-notification.dto';
import { Notification } from '../../../notifications/entities/notification.entity';
import { ProjectNotificationService } from '../services/project-notifications.service';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('projects')
export class ProjectNotificationsController {
  constructor(private readonly notificationService: ProjectNotificationService) {}

  @Post('id/:projectId/notifications')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  createNotification(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateNotificationDto
  ): Promise<Notification> {
    return this.notificationService.create(projectId, user.id, dto);
  }

  @Post('notifications/:notificationId/send')
  send(@Param('notificationId') notificationId: string): Promise<Notification> {
    return this.notificationService.send(notificationId);
  }
}
