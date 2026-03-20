import { Controller, Param, Post } from '@nestjs/common';
import { CurrentUser, Rbac } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { Event } from '../entities/event.entity';
import { EventParticipationService } from '../services/event-participation.service';

@Controller('events')
export class EventParticipationController {
  constructor(private readonly eventParticipationService: EventParticipationService) {}

  @Post('id/:eventId/participate')
  @Rbac({ resource: 'events', action: 'update' })
  participate(@Param('eventId') eventId: string, @CurrentUser() user: User): Promise<Event> {
    return this.eventParticipationService.participate(eventId, user);
  }
}
