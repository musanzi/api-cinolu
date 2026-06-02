import { Controller, Param, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { NotificationAttachment } from '../entities/attachment.entity';
import { NotificationAttachmentsService } from '../services/notification-attachments.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('notifications')
export class NotificationAttachmentsController {
  constructor(private readonly notificationAttachmentsService: NotificationAttachmentsService) {}

  @Post('id/:notificationId/attachments')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FilesInterceptor('attachments', 10, createDiskUploadOptions('./uploads/notifications')))
  addAttachments(
    @Param('notificationId') notificationId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<NotificationAttachment[]> {
    return this.notificationAttachmentsService.addAttachments(notificationId, files);
  }
}
