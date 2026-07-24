import { User } from '../entities/user.entity';

export interface SignUpResult {
  user: User;
  isNew: boolean;
}
