import { AbstractEntity } from '@/shared/abstracts';
import { Column, Entity } from 'typeorm';

@Entity()
export class Tag extends AbstractEntity {
  @Column({ unique: true })
  name: string;
}
