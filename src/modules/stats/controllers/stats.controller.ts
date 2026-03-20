import { Controller, Get, Param } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { IUSerStats } from '../types/user-stats.type';
import { IAdminStatsGeneral, IAdminStatsByYear } from '../types/admin-stats.type';
import { CurrentUser } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { Rbac } from '@musanzi/nestjs-session-auth';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('me')
  async findUserStats(@CurrentUser() user: User): Promise<IUSerStats> {
    return await this.statsService.findUserStats(user);
  }

  @Get('admin/overview')
  @Rbac({ resource: 'stats', action: 'read' })
  async findAdminOverview(): Promise<IAdminStatsGeneral> {
    return await this.statsService.findAdminStatsGeneral();
  }

  @Get('admin/year/:year')
  @Rbac({ resource: 'stats', action: 'read' })
  async findAdminStatsByYear(@Param('year') year: number): Promise<IAdminStatsByYear> {
    return await this.statsService.findAdminStatsByYear(+year);
  }
}
