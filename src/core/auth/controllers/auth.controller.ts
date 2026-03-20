import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { CurrentUser, GoogleAuthGuard, LocalAuthGuard, Public } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { ContactSupportDto } from '../dto/contact-support.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('support/contact')
  @Public()
  async contactSupport(@Body() dto: ContactSupportDto): Promise<void> {
    await this.authService.contactUs(dto);
  }

  @Post('signup')
  @Public()
  signUp(@Body() dto: SignUpDto): Promise<User> {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  @Public()
  @UseGuards(LocalAuthGuard)
  signIn(@Req() req: Request): Promise<User> {
    return this.authService.signIn(req);
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {}

  @Get('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Res() res: Response): Promise<void> {
    return this.authService.signInWithGoogle(res);
  }

  @Post('signout')
  signOut(@Req() req: Request) {
    return this.authService.signOut(req);
  }

  @Get('me')
  profile(@CurrentUser() user: User): Promise<User> {
    return this.authService.profile(user);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<User> {
    return this.authService.updateProfile(user, dto);
  }
}
