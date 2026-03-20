import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipation } from '../entities/event-participation.entity';
import { Event } from '../entities/event.entity';
import { User } from '@/modules/users/entities/user.entity';
import { EventsService } from './events.service';

@Injectable()
export class EventParticipationService {
  constructor(
    @InjectRepository(EventParticipation)
    private readonly participationRepository: Repository<EventParticipation>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly eventsService: EventsService
  ) {}

  async participate(eventId: string, user: User): Promise<Event> {
    const existing = await this.participationRepository.findOne({
      where: { event: { id: eventId }, user: { id: user.id } }
    });
    if (existing) {
      throw new BadRequestException('Participation déjà enregistrée');
    }

    await this.eventsService.findOne(eventId);
    await this.participationRepository.save({
      user: { id: user.id },
      event: { id: eventId }
    });

    return this.eventRepository.findOneOrFail({
      where: { id: eventId },
      relations: ['categories', 'event_manager', 'participations', 'participations.user']
    });
  }
}
