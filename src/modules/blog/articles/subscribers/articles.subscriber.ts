import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import slugify from 'slugify';
import { Article } from '../entities/article.entity';

@EventSubscriber()
export class ArticlesSubscriber implements EntitySubscriberInterface<Article> {
  listenTo() {
    return Article;
  }

  async beforeInsert(event: InsertEvent<Article>): Promise<void> {
    const { title } = event.entity;
    event.entity.slug = slugify(title, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Article>): Promise<void> {
    const { title } = event.entity;
    if (!title) return;
    event.entity.slug = slugify(title, { lower: true });
  }
}
