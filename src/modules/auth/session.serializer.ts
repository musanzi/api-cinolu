import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from '../identity/users/entities/user.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: User, done: (_: null, user: User) => void): void {
    done(null, user);
  }

  deserializeUser(payload: string, done: (_: null, payload: string) => void) {
    done(null, payload);
  }
}
