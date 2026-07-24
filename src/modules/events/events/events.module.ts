import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventParticipation } from './entities/event-participation.entity';
import { EventSubscriber } from './subscribers/event.subscriber';
import { EventCategoriesModule } from '../../events/categories/categories.module';
import { GalleriesModule } from '../../galleries/galleries.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventParticipation]), EventCategoriesModule, GalleriesModule],
  controllers: [EventsController],
  providers: [EventsService, EventSubscriber],
  exports: [EventsService]
})
export class EventsModule {}
