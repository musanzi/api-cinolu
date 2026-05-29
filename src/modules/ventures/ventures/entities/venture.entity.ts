import { User } from '../../../identity/users/entities/user.entity';
import { AbstractEntity } from '@/shared/helpers/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Product } from '../../../ventures/products/entities/product.entity';
import { VentureDocument } from './document.entity';
import { Gallery } from '../../../galleries/entities/gallery.entity';

@Entity()
export class Venture extends AbstractEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  problem_solved: string;

  @Column({ type: 'text' })
  target_market: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  cover: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  linkedin_url: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ type: 'date', nullable: true })
  founded_at: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  stage: string;

  @ManyToOne(() => User, (user) => user.ventures)
  @JoinColumn()
  owner: User;

  @OneToMany(() => Product, (product) => product.venture)
  products: Product[];

  @OneToMany(() => Gallery, (gallery) => gallery.venture)
  gallery: Gallery[];

  @OneToMany(() => VentureDocument, (document) => document.venture)
  documents: VentureDocument[];
}
