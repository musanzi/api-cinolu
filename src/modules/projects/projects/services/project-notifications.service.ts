import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { Notification } from '../../../notifications/entities/notification.entity';
import { CreateNotificationDto } from '../../../notifications/dto/create-notification.dto';
import { User } from '../../../identity/users/entities/user.entity';
import { ProjectsService } from './projects.service';
import { ProjectParticipationService } from './project-participations.service';
import { MentorsService } from '../../../mentors/mentors/services/mentors.service';
import { UsersService } from '../../../identity/users/services/users.service';

@Injectable()
export class ProjectNotificationService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly projectsService: ProjectsService,
    private readonly participationService: ProjectParticipationService,
    private readonly mentorsService: MentorsService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(projectId: string, user: User, dto: CreateNotificationDto): Promise<Notification> {
    try {
      await this.projectsService.findOne(projectId);
      const notification = await this.notificationsService.create(projectId, user.id, dto);
      return this.notificationsService.findOne(notification.id);
    } catch {
      throw new BadRequestException('Création de notification impossible');
    }
  }

  async send(notificationId: string): Promise<Notification> {
    try {
      const notification = await this.notificationsService.findOne(notificationId);
      let recipients = [];
      if (notification.notify_staff) {
        recipients = await this.usersService.findStaff();
      } else if (notification.notify_mentors) {
        recipients = await this.mentorsService.findUsersByPhase(notification.phase.id);
      } else if (notification.phase) {
        recipients = await this.participationService.findByPhase(notification.phase.id);
      } else {
        recipients = await this.participationService.findByProject(notification.project.id);
      }
      this.eventEmitter.emit('notify.participants', recipients, notification);
      return await this.notificationsService.send(notificationId);
    } catch {
      throw new BadRequestException('Envoi de notification impossible');
    }
  }
}
