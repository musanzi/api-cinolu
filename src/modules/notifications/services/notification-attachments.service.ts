import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { NotificationAttachment } from '../entities/attachment.entity';
import { NotificationsService } from './notifications.service';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class NotificationAttachmentsService extends AbstractRepository<NotificationAttachment> {
  constructor(
    @InjectRepository(NotificationAttachment)
    repository: Repository<NotificationAttachment>,
    private readonly notificationsService: NotificationsService
  ) {
    super(repository);
  }

  async addAttachments(id: string, files: Express.Multer.File[]): Promise<NotificationAttachment[]> {
    try {
      const notification = await this.notificationsService.findOne(id);
      const attachments = files.map((file) => ({
        filename: file.filename,
        mimetype: file.mimetype,
        notification: { id: notification.id }
      }));
      return await this.repository.save(attachments);
    } catch {
      throw new BadRequestException('Ajout des pièces jointes impossible');
    }
  }

  async findAttachment(id: string): Promise<NotificationAttachment> {
    return await this.findEntity({ where: { id } });
  }

  async removeAttachment(id: string): Promise<void> {
    try {
      const attachment = await this.findAttachment(id);
      if (attachment.filename) {
        await fs.unlink(`./uploads/notifications/${attachment.filename}`).catch(() => undefined);
      }
      await this.repository.delete(attachment);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
