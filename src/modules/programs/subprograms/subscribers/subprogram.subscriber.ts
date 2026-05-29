import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import slugify from 'slugify';
import { Subprogram } from '../entities/subprogram.entity';

@EventSubscriber()
export class SubprogramSubscriber implements EntitySubscriberInterface<Subprogram> {
  listenTo() {
    return Subprogram;
  }

  async beforeInsert(event: InsertEvent<Subprogram>): Promise<void> {
    const { name } = event.entity;
    event.entity.slug = slugify(name, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Subprogram>): Promise<void> {
    const { name } = event.entity;
    if (!name) return;
    event.entity.slug = slugify(name, { lower: true });
  }
}
