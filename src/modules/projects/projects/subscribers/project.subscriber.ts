import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { Project } from '../entities/project.entity';
import slugify from 'slugify';

@EventSubscriber()
export class ProjectSubscriber implements EntitySubscriberInterface<Project> {
  listenTo() {
    return Project;
  }

  async beforeInsert(event: InsertEvent<Project>): Promise<void> {
    const { name } = event.entity;
    event.entity.slug = slugify(name, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Project>): Promise<void> {
    const { name } = event.entity;
    if (!name) return;
    event.entity.slug = slugify(name, { lower: true });
  }
}
