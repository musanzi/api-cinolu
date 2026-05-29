import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    if (!event?.entity) return;
    const { password } = event.entity;
    if (!password) return;
    event.entity.password = await bcrypt.hash(password, 10);
  }

  async beforeUpdate(event: UpdateEvent<User>): Promise<void> {
    if (!event?.entity) return;
    const { password } = event.entity;
    if (!password) return;
    event.entity.password = await bcrypt.hash(password, 10);
  }
}
