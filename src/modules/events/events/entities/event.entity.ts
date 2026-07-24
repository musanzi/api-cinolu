import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/abstracts';
import { User } from '@/modules/users/entities/user.entity';
import { Subprogram } from '../../../programs/subprograms/entities/subprogram.entity';
import { EventCategory } from '../../../events/categories/entities/category.entity';
import { EventParticipation } from './event-participation.entity';
import { Gallery } from '../../../galleries/entities/gallery.entity';

@Entity()
export class Event extends AbstractEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'boolean', nullable: true, default: false })
  is_highlighted: boolean;

  @Column({ nullable: true })
  cover: string;

  @Column()
  place: string;

  @Column({ type: 'longtext' })
  description: string;

  @Column({ type: 'text', nullable: true })
  context: string;

  @Column({ type: 'text', nullable: true })
  objectives: string;

  @Column({ type: 'int', nullable: true })
  duration_hours: number;

  @ManyToOne(() => User, (user) => user.managed_events, { nullable: true })
  @JoinColumn()
  event_manager: User;

  @Column({ type: 'text', nullable: true })
  selection_criteria: string;

  @Column({ type: 'date' })
  started_at: Date;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ type: 'date' })
  ended_at: Date;

  @ManyToOne(() => Subprogram, (p) => p.events)
  @JoinColumn()
  program: Subprogram;

  @ManyToMany(() => EventCategory, (category) => category.events)
  @JoinTable()
  categories: EventCategory[];

  @OneToMany(() => Gallery, (gallery) => gallery.event)
  gallery: Gallery[];

  @OneToMany(() => EventParticipation, (participation) => participation.event)
  participations: EventParticipation[];
}
