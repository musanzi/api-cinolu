import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../../identity/users/dto/create-user.dto';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { GoogleProfileInterface } from '../interfaces/google-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    configService: ConfigService
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_SECRET'),
      callbackURL: configService.get('GOOGLE_REDIRECT_URI'),
      scope: ['profile', 'email']
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: GoogleProfileInterface) {
    const { emails, name, photos } = profile;
    const userDto: CreateUserDto = {
      email: emails[0]['value'],
      name: `${name['givenName']} ${name['familyName']}`,
      google_image: photos[0]['value']
    };
    return await this.authService.findOrCreate(userDto);
  }
}
