import { Entity, Column, OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { Experience } from './experience.entity';
import { Expertise } from '../../../mentors/expertises/entities/expertise.entity';
import { AbstractEntity } from '@/shared/abstracts';
import { User } from '@/modules/users/entities/user.entity';
import { MentorStatus, MentorType } from '../enums/mentor.enum';
import { Phase } from '../../../projects/phases/entities/phase.entity';

@Entity()
export class MentorProfile extends AbstractEntity {
  @Column({ type: 'int', default: 0 })
  years_experience: number;

  @Column({ nullable: true })
  cv: string;

  @Column({ type: 'enum', enum: MentorStatus, default: MentorStatus.PENDING })
  status: MentorStatus;

  @Column({ type: 'enum', enum: MentorType, default: MentorType.COACH })
  type: MentorType;

  @OneToOne(() => User, (user) => user.mentor_profile)
  @JoinColumn()
  owner: User;

  @OneToMany(() => Experience, (exp) => exp.mentor_profile, { cascade: true })
  experiences: Experience[];

  @ManyToMany(() => Expertise, (expertise) => expertise.mentors_profiles)
  @JoinTable()
  expertises: Expertise[];

  @ManyToMany(() => Phase, (phase) => phase.mentors)
  phases: Phase[];
}
