import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationAttachmentsController } from './controllers/notification-attachments.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationAttachment } from './entities/attachment.entity';
import { UsersModule } from '../users/users.module';
import { NotificationAttachmentsService } from './services/notification-attachments.service';
import { NOTIFICATIONS_RBAC_POLICY } from './notifications-rbac';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationAttachment]),
    UsersModule,
    SessionAuthModule.forFeature([NOTIFICATIONS_RBAC_POLICY])
  ],
  controllers: [NotificationsController, NotificationAttachmentsController],
  providers: [NotificationsService, NotificationAttachmentsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
