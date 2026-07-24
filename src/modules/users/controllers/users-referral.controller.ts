import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersReferralService } from '../services/users-referral.service';
import { CurrentUser, Public } from '@/modules/auth/decorators';

@Controller('users')
export class UsersReferralController {
  constructor(private readonly usersReferralService: UsersReferralService) {}

  @Post('referral-code/generate')
  async generateReferralLink(@CurrentUser() user: User): Promise<User> {
    return this.usersReferralService.saveReferralCode(user);
  }

  @Get('ambassadors')
  @Public()
  findAmbassadors(): Promise<[User[], number]> {
    return this.usersReferralService.findAmbassadors();
  }

  @Get('ambassadors/:email')
  @Public()
  findAmbassadorByEmail(@Param('email') email: string): Promise<User> {
    return this.usersReferralService.findAmbassadorByEmail(email);
  }

  @Get('me/referred-users')
  async findReferredUsers(@Query('page') page: number, @CurrentUser() user: User): Promise<[User[], number]> {
    return this.usersReferralService.referredUsers(page, user);
  }
}
