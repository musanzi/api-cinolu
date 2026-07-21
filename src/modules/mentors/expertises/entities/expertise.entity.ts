import { Entity, Column, ManyToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/abstracts';
import { MentorProfile } from '../../../mentors/mentors/entities/mentor.entity';

@Entity()
export class Expertise extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => MentorProfile, (mp) => mp.expertises)
  mentors_profiles: MentorProfile[];
}
