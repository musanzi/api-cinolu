import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { NotificationStatus } from '../types/notification-status.enum';
import { FilterNotificationsInterface } from '../interfaces/filter-notifications.interface';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { NotificationAttachment } from '../entities/attachment.entity';
import { promises as fs } from 'fs';

@Injectable()
export class NotificationsService extends AbstractRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>,
    @InjectRepository(NotificationAttachment)
    private readonly attachmentRepository: Repository<NotificationAttachment>
  ) {
    super(repository);
  }

  async create(projectId: string, senderId: string, dto: CreateNotificationDto): Promise<Notification> {
    return await this.createEntity({
      ...dto,
      project: { id: projectId },
      sender: { id: senderId },
      phase: dto.phase_id ? { id: dto.phase_id } : null
    });
  }

  async send(id: string): Promise<Notification> {
    return await this.updateEntity(id, { status: NotificationStatus.SENT });
  }

  async findByProject(projectId: string, filters: FilterNotificationsInterface): Promise<[Notification[], number]> {
    const { phaseId, page, status } = filters;
    const query = this.repository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.phase', 'phase')
      .leftJoinAndSelect('n.sender', 'sender')
      .leftJoinAndSelect('n.attachments', 'attachments')
      .leftJoinAndSelect('n.project', 'project')
      .orderBy('n.created_at', 'DESC')
      .where('n.projectId = :projectId', { projectId });
    if (phaseId) query.andWhere('n.phaseId = :phaseId', { phaseId });
    if (status) query.andWhere('n.status = :status', { status });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findOne(id: string): Promise<Notification> {
    return await this.findEntity({ where: { id }, relations: ['phase', 'sender', 'attachments', 'project'] });
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async addAttachments(id: string, files: Express.Multer.File[]): Promise<NotificationAttachment[]> {
    try {
      const notification = await this.findOne(id);
      const attachments = files.map((file) => ({
        filename: file.filename,
        mimetype: file.mimetype,
        notification: { id: notification.id }
      }));
      return await this.attachmentRepository.save(attachments);
    } catch {
      throw new BadRequestException('Ajout des pièces jointes impossible');
    }
  }

  async findAttachment(id: string): Promise<NotificationAttachment> {
    return await this.attachmentRepository.findOneByOrFail({ id });
  }

  async removeAttachment(id: string): Promise<void> {
    try {
      const attachment = await this.findAttachment(id);
      if (attachment.filename) {
        await fs.unlink(`./uploads/notifications/${attachment.filename}`).catch(() => undefined);
      }
      await this.attachmentRepository.delete(attachment);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
