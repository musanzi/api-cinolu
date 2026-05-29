import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import slugify from 'slugify';
import { Venture } from '../entities/venture.entity';

@EventSubscriber()
export class VentureSubscriber implements EntitySubscriberInterface<Venture> {
  listenTo() {
    return Venture;
  }

  async beforeInsert(event: InsertEvent<Venture>): Promise<void> {
    const { name } = event.entity;
    event.entity.slug = slugify(name, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Venture>): Promise<void> {
    const { name } = event.entity;
    if (!name) return;
    event.entity.slug = slugify(name, { lower: true });
  }
}
