import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Phase } from '../../entities/phase.entity';
import { DeliverableSubmission } from './submission.entity';

@Entity()
export class Deliverable extends AbstractEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Phase, (phase) => phase.deliverables, { onDelete: 'CASCADE' })
  @JoinColumn()
  phase: Phase;

  @OneToMany(() => DeliverableSubmission, (submission) => submission.deliverable)
  submissions: DeliverableSubmission[];
}
