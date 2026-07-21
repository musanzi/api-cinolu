import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/abstracts';
import { Program } from '../../../programs/programs/entities/program.entity';

@Entity()
export class ProgramCategory extends AbstractEntity {
  @Column()
  name: string;

  @OneToMany(() => Program, (p) => p.category)
  programs: Program[];
}
