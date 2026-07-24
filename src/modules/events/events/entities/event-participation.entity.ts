import { Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '@/shared/abstracts';
import { User } from '@/modules/users/entities/user.entity';
import { Event } from '../../../events/events/entities/event.entity';

@Entity()
@Unique(['user.id', 'event.id'])
export class EventParticipation extends AbstractEntity {
  @ManyToOne(() => User, (user) => user.event_participations, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Event, (event) => event.participations, { onDelete: 'CASCADE' })
  @JoinColumn()
  event: Event;
}
