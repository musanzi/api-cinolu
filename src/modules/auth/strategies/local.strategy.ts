import { Injectable } from '@nestjs/common';
import { LocalAuthStrategy } from '@musanzi/nestjs-session-auth';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends LocalAuthStrategy {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string) {
    return this.authService.validateUser(email, password);
  }
}
