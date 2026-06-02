import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Subprogram } from '../../../programs/subprograms/entities/subprogram.entity';
import { ProgramCategory } from '../../../programs/categories/entities/category.entity';
import { ProgramSector } from '../../../programs/sectors/entities/sector.entity';

@Entity()
export class Program extends AbstractEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'boolean', nullable: true, default: false })
  is_highlighted: boolean;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @OneToMany(() => Subprogram, (sp) => sp.program)
  subprograms: Subprogram[];

  @ManyToOne(() => ProgramCategory, (category) => category.programs)
  @JoinColumn()
  category: ProgramCategory;

  @ManyToOne(() => ProgramSector, (sector) => sector.programs)
  @JoinColumn()
  sector: ProgramSector;
}
