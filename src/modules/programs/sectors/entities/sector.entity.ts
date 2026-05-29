import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/shared/helpers/abstract.entity';
import { Program } from '../../../programs/programs/entities/program.entity';

@Entity()
export class ProgramSector extends AbstractEntity {
  @Column()
  name: string;

  @OneToMany(() => Program, (program) => program.sector)
  programs: Program[];
}
