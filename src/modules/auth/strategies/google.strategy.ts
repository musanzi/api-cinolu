import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthStrategy, GoogleProfile, GoogleVerifyCallback } from '@musanzi/nestjs-session-auth';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../../identity/users/dto/create-user.dto';

@Injectable()
export class GoogleStrategy extends GoogleAuthStrategy {
  constructor(
    private authService: AuthService,
    configService: ConfigService
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_SECRET'),
      callbackURL: configService.get('GOOGLE_REDIRECT_URI')
    });
  }

  async validate(_at: string, _rt: string, profile: GoogleProfile, done: GoogleVerifyCallback) {
    const { emails, name, photos } = profile;
    const userDto: CreateUserDto = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      google_image: photos[0].value
    };
    const user = await this.authService.findOrCreate(userDto);
    done(null, user);
  }
}
