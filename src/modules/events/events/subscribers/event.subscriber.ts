import { EntitySubscriberInterface, EventSubscriber as Subscriber, InsertEvent, UpdateEvent } from 'typeorm';
import slugify from 'slugify';
import { Event } from '../entities/event.entity';

@Subscriber()
export class EventSubscriber implements EntitySubscriberInterface<Event> {
  listenTo() {
    return Event;
  }

  async beforeInsert(event: InsertEvent<Event>): Promise<void> {
    const { name } = event.entity;
    event.entity.slug = slugify(name, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Event>): Promise<void> {
    const { name } = event.entity;
    if (!name) return;
    event.entity.slug = slugify(name, { lower: true });
  }
}
