import { Column, Entity, ManyToMany } from 'typeorm';
import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Project } from '../../../projects/projects/entities/project.entity';

@Entity()
export class ProjectCategory extends AbstractEntity {
  @Column()
  name: string;

  @ManyToMany(() => Project, (program) => program.categories)
  projects: Project[];
}
