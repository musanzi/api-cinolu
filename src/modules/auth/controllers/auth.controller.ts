import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { User } from '../../identity/users/entities/user.entity';
import { UpdateUserDto } from '../../identity/users/dto/update-user.dto';
import { ContactSupportDto } from '../dto/contact-support.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { AuthService } from '../services/auth.service';
import { UpdatePasswordDto } from '@/modules/auth/dto/update-password.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { Public } from '../decorators/public.decorator';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

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

  @Patch('me/password')
  updatePassword(user: User, @Body() dto: UpdatePasswordDto): Promise<User> {
    return this.authService.updatePassword(user, dto);
  }

  @Post('password/forgot')
  @Public()
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<User> {
    return this.authService.resetPassword(dto);
  }
}
