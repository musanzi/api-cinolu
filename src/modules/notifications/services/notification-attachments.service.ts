import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { NotificationAttachment } from '../entities/attachment.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationAttachmentsService {
  constructor(
    @InjectRepository(NotificationAttachment)
    private readonly attachmentsRepository: Repository<NotificationAttachment>,
    private readonly notificationsService: NotificationsService
  ) {}

  async addAttachments(id: string, files: Express.Multer.File[]): Promise<NotificationAttachment[]> {
    try {
      const notification = await this.notificationsService.findOne(id);
      const attachments = files.map((file) => ({
        filename: file.filename,
        mimetype: file.mimetype,
        notification: { id: notification.id }
      }));
      return await this.attachmentsRepository.save(attachments);
    } catch {
      throw new BadRequestException("Ajout des pièces jointes impossible");
    }
  }

  async findAttachment(id: string): Promise<NotificationAttachment> {
    try {
      return await this.attachmentsRepository.findOneOrFail({
        where: { id }
      });
    } catch {
      throw new BadRequestException('Pièce jointe introuvable');
    }
  }

  async removeAttachment(id: string): Promise<void> {
    try {
      const attachment = await this.findAttachment(id);
      if (attachment.filename) {
        await fs.unlink(`./uploads/notifications/${attachment.filename}`).catch(() => undefined);
      }
      await this.attachmentsRepository.delete(attachment);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
