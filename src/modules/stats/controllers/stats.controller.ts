import { Controller, Get, Param } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { IUSerStats } from '../types/user-stats.type';
import { IAdminStatsGeneral, IAdminStatsByYear } from '../types/admin-stats.type';
import { CurrentUser, HasRoles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { Roles } from '@/modules/auth/enums';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('me')
  async findUserStats(@CurrentUser() user: User): Promise<IUSerStats> {
    return await this.statsService.findUserStats(user.id);
  }

  @Get('admin/overview')
  @HasRoles([Roles.STAFF])
  async findAdminOverview(): Promise<IAdminStatsGeneral> {
    return await this.statsService.findAdminStatsGeneral();
  }

  @Get('admin/year/:year')
  @HasRoles([Roles.STAFF])
  async findAdminStatsByYear(@Param('year') year: number): Promise<IAdminStatsByYear> {
    return await this.statsService.findAdminStatsByYear(+year);
  }
}
