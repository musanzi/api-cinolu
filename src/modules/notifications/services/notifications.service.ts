import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { NotificationStatus } from '../types/notification-status.enum';
import { FilterNotificationsDto } from '../dto/filter-notifications.dto';
import { UsersService } from '@/modules/users/services/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(projectId: string, senderId: string, dto: CreateNotificationDto): Promise<Notification> {
    try {
      return await this.notificationsRepository.save({
        ...dto,
        project: { id: projectId },
        sender: { id: senderId },
        phase: dto.phase_id ? { id: dto.phase_id } : null
      });
    } catch {
      throw new BadRequestException('Création de notification impossible');
    }
  }

  async send(id: string): Promise<Notification> {
    try {
      await this.notificationsRepository.update(id, { status: NotificationStatus.SENT });
      return await this.findOne(id);
    } catch {
      throw new BadRequestException('Envoi de notification impossible');
    }
  }

  async findByProject(projectId: string, filters: FilterNotificationsDto): Promise<[Notification[], number]> {
    try {
      const { phaseId, page = 1, status } = filters;
      const query = this.notificationsRepository
        .createQueryBuilder('n')
        .leftJoinAndSelect('n.phase', 'phase')
        .leftJoinAndSelect('n.sender', 'sender')
        .leftJoinAndSelect('n.attachments', 'attachments')
        .leftJoinAndSelect('n.project', 'project')
        .orderBy('n.created_at', 'DESC')
        .where('n.projectId = :projectId', { projectId });
      if (phaseId) query.andWhere('n.phaseId = :phaseId', { phaseId });
      if (status) query.andWhere('n.status = :status', { status });
      return await query
        .skip((+page - 1) * 10)
        .take(10)
        .getManyAndCount();
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Notifications introuvables');
    }
  }

  async findOne(id: string): Promise<Notification> {
    try {
      return await this.notificationsRepository.findOneOrFail({
        where: { id },
        relations: ['phase', 'sender', 'attachments', 'project']
      });
    } catch {
      throw new BadRequestException('Notification introuvable');
    }
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.findOne(id);
      this.notificationsRepository.merge(notification, dto);
      const savedNotification = await this.notificationsRepository.save(notification);
      return await this.findOne(savedNotification.id);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.notificationsRepository.softDelete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
