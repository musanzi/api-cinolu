import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller';
import { StatsService } from './services/stats.service';

@Module({
  imports: [],
  controllers: [StatsController],
  providers: [StatsService]
})
export class StatsModule {}
