import { AbstractEntity } from '@/shared/helpers/abstract.entity';
import { ProjectParticipation } from '../../../../projects/projects/entities/project-participation.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Deliverable } from './deliverable.entity';

@Entity()
@Unique(['deliverable', 'participation'])
export class DeliverableSubmission extends AbstractEntity {
  @Column()
  file: string;

  @ManyToOne(() => Deliverable, (deliverable) => deliverable.submissions)
  @JoinColumn()
  deliverable: Deliverable;

  @ManyToOne(() => ProjectParticipation, (participation) => participation.deliverable_submissions)
  @JoinColumn()
  participation: ProjectParticipation;
}
