import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Tag extends AbstractEntity {
  @Column({ unique: true })
  name: string;
}
