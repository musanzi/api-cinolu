import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller';
import { StatsService } from './services/stats.service';
import { STATS_RBAC_POLICY } from './stats-rbac';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [SessionAuthModule.forFeature([STATS_RBAC_POLICY])],
  controllers: [StatsController],
  providers: [StatsService]
})
export class StatsModule {}
