import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import slugify from 'slugify';
import { Program } from '../entities/program.entity';

@EventSubscriber()
export class ProgramSubscriber implements EntitySubscriberInterface<Program> {
  listenTo() {
    return Program;
  }

  async beforeInsert(event: InsertEvent<Program>): Promise<void> {
    const { name } = event.entity;
    event.entity.slug = slugify(name, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Program>): Promise<void> {
    const { name } = event.entity;
    if (!name) return;
    event.entity.slug = slugify(name, { lower: true });
  }
}
