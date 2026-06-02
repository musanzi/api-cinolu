import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunitiesController } from './controllers/opportunities.controller';
import { OpportunityMediaController } from './controllers/opportunity-media.controller';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunityMediaService } from './services/opportunity-media.service';
import { OpportunitiesService } from './services/opportunities.service';
import { OpportunitySubscriber } from './subscribers/opportunity.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Opportunity])],
  controllers: [OpportunitiesController, OpportunityMediaController],
  providers: [OpportunitiesService, OpportunityMediaService, OpportunitySubscriber],
  exports: [OpportunitiesService]
})
export class OpportunitiesModule {}
