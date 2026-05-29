import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import slugify from 'slugify';
import { Product } from '../entities/product.entity';

@EventSubscriber()
export class ProductSubscriber implements EntitySubscriberInterface<Product> {
  listenTo() {
    return Product;
  }

  async beforeInsert(event: InsertEvent<Product>): Promise<void> {
    const { name } = event.entity;
    event.entity.slug = slugify(name, { lower: true });
  }

  async beforeUpdate(event: UpdateEvent<Product>): Promise<void> {
    const { name } = event.entity;
    if (!name) return;
    event.entity.slug = slugify(name, { lower: true });
  }
}
