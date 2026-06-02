import { Controller, Param, Post } from '@nestjs/common';
import { Event } from '../entities/event.entity';
import { EventParticipationService } from '../services/event-participation.service';
import { CurrentUser } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';

@Controller('events')
export class EventParticipationController {
  constructor(private readonly eventParticipationService: EventParticipationService) {}

  @Post('id/:eventId/participate')
  participate(@Param('eventId') eventId: string, @CurrentUser() user: User): Promise<Event> {
    return this.eventParticipationService.participate(eventId, user.id);
  }
}
