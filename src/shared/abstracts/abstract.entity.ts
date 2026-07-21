import { CreateDateColumn, DeleteDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export abstract class AbstractEntity {
  @PrimaryColumn({ type: 'uuid', generated: 'uuid' })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
