import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venture } from './venture.entity';

@Entity()
export class VentureDocument extends AbstractEntity {
  @Column()
  type: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Venture, (venture) => venture.documents)
  @JoinColumn()
  venture: Venture;
}
