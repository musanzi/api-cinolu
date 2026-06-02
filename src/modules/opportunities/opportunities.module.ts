import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunitiesController } from './controllers/opportunities.controller';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunitiesService } from './services/opportunities.service';
import { OpportunitySubscriber } from './subscribers/opportunity.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Opportunity])],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService, OpportunitySubscriber],
  exports: [OpportunitiesService]
})
export class OpportunitiesModule {}
