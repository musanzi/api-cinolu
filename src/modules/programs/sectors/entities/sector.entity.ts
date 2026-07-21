import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/abstracts';
import { Program } from '../../../programs/programs/entities/program.entity';

@Entity()
export class ProgramSector extends AbstractEntity {
  @Column()
  name: string;

  @OneToMany(() => Program, (program) => program.sector)
  programs: Program[];
}
