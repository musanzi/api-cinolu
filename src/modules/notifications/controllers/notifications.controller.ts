import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilterNotificationsInterface } from '../interfaces/filter-notifications.interface';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { Notification } from '../entities/notification.entity';
import { NotificationsService } from '../services/notifications.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { NotificationAttachment } from '../entities/attachment.entity';

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

  @Post('id/:notificationId/attachments')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FilesInterceptor('attachments', 10, createDiskUploadOptions('./uploads/notifications')))
  addAttachments(
    @Param('notificationId') notificationId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<NotificationAttachment[]> {
    return this.notificationsService.addAttachments(notificationId, files);
  }
}
