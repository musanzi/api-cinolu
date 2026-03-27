import { AbstractEntity } from '@/core/helpers/abstract.entity';
import { Phase } from '@/modules/projects/phases/entities/phase.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ProjectParticipation } from './project-participation.entity';

@Entity()
@Unique(['participation', 'phase'])
export class ProjectParticipationReview extends AbstractEntity {
  @ManyToOne(() => ProjectParticipation, (participation) => participation.reviews, { onDelete: 'CASCADE' })
  @JoinColumn()
  participation: ProjectParticipation;

  @ManyToOne(() => Phase, (phase) => phase.reviews, { onDelete: 'CASCADE' })
  @JoinColumn()
  phase: Phase;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'int', default: 0 })
  score: number;
}
