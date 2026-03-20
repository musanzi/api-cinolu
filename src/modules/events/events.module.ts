import { Module } from '@nestjs/common';
import { EventMediaController } from './controllers/event-media.controller';
import { EventParticipationController } from './controllers/event-participation.controller';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventParticipation } from './entities/event-participation.entity';
import { EventSubscriber } from './subscribers/event.subscriber';
import { EventCategoriesModule } from './categories/categories.module';
import { EventMediaService } from './services/event-media.service';
import { EventParticipationService } from './services/event-participation.service';
import { EVENTS_RBAC_POLICY } from './events-rbac';
import { GalleriesModule } from '@/shared/galleries/galleries.module';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventParticipation]),
    EventCategoriesModule,
    GalleriesModule,
    SessionAuthModule.forFeature([EVENTS_RBAC_POLICY])
  ],
  controllers: [EventsController, EventMediaController, EventParticipationController],
  providers: [EventsService, EventMediaService, EventParticipationService, EventSubscriber],
  exports: [EventsService]
})
export class EventsModule {}
