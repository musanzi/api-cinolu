import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { NotificationStatus } from '../types/notification-status.enum';
import { FilterNotificationsInterface } from '../interfaces/filter-notifications.interface';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class NotificationsService extends AbstractRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>
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
}
