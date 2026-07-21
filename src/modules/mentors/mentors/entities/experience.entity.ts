import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MentorProfile } from './mentor.entity';
import { AbstractEntity } from '@/shared/abstracts';

@Entity()
export class Experience extends AbstractEntity {
  @Column()
  company_name: string;

  @Column()
  job_title: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: false })
  is_current: boolean;

  @ManyToOne(() => MentorProfile, (mentor) => mentor.experiences)
  @JoinColumn()
  mentor_profile: MentorProfile;
}
