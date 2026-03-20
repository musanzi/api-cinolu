import { Controller, Param, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { NotificationAttachment } from '../entities/attachment.entity';
import { NotificationAttachmentsService } from '../services/notification-attachments.service';

@Controller('notifications')
export class NotificationAttachmentsController {
  constructor(private readonly notificationAttachmentsService: NotificationAttachmentsService) {}

  @Post('id/:notificationId/attachments')
  @Rbac({ resource: 'notifications', action: 'update' })
  @UseInterceptors(FilesInterceptor('attachments', 10, createDiskUploadOptions('./uploads/notifications')))
  addAttachments(
    @Param('notificationId') notificationId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<NotificationAttachment[]> {
    return this.notificationAttachmentsService.addAttachments(notificationId, files);
  }
}
