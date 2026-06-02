import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@/modules/database/abstract.entity';
import { Notification } from './notification.entity';

@Entity()
export class NotificationAttachment extends AbstractEntity {
  @Column()
  filename: string;

  @Column({ nullable: true })
  mimetype: string;

  @ManyToOne(() => Notification, (notification) => notification.attachments, {
    onDelete: 'CASCADE'
  })
  @JoinColumn()
  notification: Notification;
}
