import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectParticipation } from '../../../projects/projects/entities/project-participation.entity';
import { DeliverablesController } from './controllers/deliverables.controller';
import { Deliverable } from './entities/deliverable.entity';
import { DeliverableSubmission } from './entities/submission.entity';
import { DeliverablesService } from './services/deliverables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Deliverable, DeliverableSubmission, ProjectParticipation])],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
  controllers: [DeliverablesController]
})
export class ProjectDeliverablesModule {}
