import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/helpers/abstract.entity';
import { User } from '../../../identity/users/entities/user.entity';
import { Subprogram } from '../../../programs/subprograms/entities/subprogram.entity';
import { ProjectCategory } from '../../../projects/categories/entities/category.entity';
import { Phase } from '../../../projects/phases/entities/phase.entity';
import { ProjectParticipation } from './project-participation.entity';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { Resource } from '../../../projects/resources/entities/resource.entity';

@Entity()
export class Project extends AbstractEntity {
  @Column()
  name: string;

  @Column({ type: 'boolean', nullable: true, default: false })
  is_highlighted: boolean;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  cover: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  started_at: Date;

  @Column({ type: 'date' })
  ended_at: Date;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ type: 'text', nullable: true })
  context: string;

  @Column({ type: 'text', nullable: true })
  objectives: string;

  @Column({ type: 'int', nullable: true })
  duration_hours: number;

  @ManyToOne(() => User, (user) => user.managed_projects, { nullable: true })
  @JoinColumn()
  project_manager: User;

  @Column({ type: 'text', nullable: true })
  selection_criteria: string;

  @ManyToOne(() => Subprogram, (p) => p.projects)
  @JoinColumn()
  program: Subprogram;

  @ManyToMany(() => ProjectCategory, (category) => category.projects)
  @JoinTable()
  categories: ProjectCategory[];

  @OneToMany(() => Gallery, (gallery) => gallery.project)
  gallery: Gallery[];

  @OneToMany(() => ProjectParticipation, (participation) => participation.project)
  participations: ProjectParticipation[];

  @OneToMany(() => Phase, (phase) => phase.project)
  phases: Phase[];

  @OneToMany(() => Resource, (resource) => resource.project)
  resources: Resource[];
}
