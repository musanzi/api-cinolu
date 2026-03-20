import { Body, Controller, Patch, Post } from '@nestjs/common';
import { CurrentUser, Public } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { AuthPasswordService } from '../services/auth-password.service';

@Controller('auth')
export class AuthPasswordController {
  constructor(private readonly authPasswordService: AuthPasswordService) {}

  @Patch('me/password')
  updatePassword(@CurrentUser() user: User, @Body() dto: UpdatePasswordDto): Promise<User> {
    return this.authPasswordService.updatePassword(user, dto);
  }

  @Post('password/forgot')
  @Public()
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authPasswordService.forgotPassword(dto);
  }

  @Post('password/reset')
  @Public()
  resetPassword(@Body() dto: ResetPasswordDto): Promise<User> {
    return this.authPasswordService.resetPassword(dto);
  }
}
