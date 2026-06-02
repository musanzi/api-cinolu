import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Article } from '../../content/blog/articles/entities/article.entity';
import { Project } from '../../projects/projects/entities/project.entity';
import { Event } from '../../events/events/entities/event.entity';
import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Venture } from '../../ventures/ventures/entities/venture.entity';
import { Product } from '../../ventures/products/entities/product.entity';

@Entity()
export class Gallery extends AbstractEntity {
  @Column({ nullable: true })
  image: string;

  @ManyToOne(() => Project)
  @JoinColumn()
  project: Project;

  @ManyToOne(() => Event)
  @JoinColumn()
  event: Event;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Venture)
  @JoinColumn()
  venture: Venture;

  @ManyToOne(() => Article)
  @JoinColumn()
  article: Article;
}
