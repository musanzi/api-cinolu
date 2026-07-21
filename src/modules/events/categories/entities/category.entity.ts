import { Column, Entity, ManyToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/abstracts';
import { Event } from '../../../events/events/entities/event.entity';

@Entity()
export class EventCategory extends AbstractEntity {
  @Column()
  name: string;

  @ManyToMany(() => Event, (event) => event.categories)
  events: Event[];
}
