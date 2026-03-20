import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectParticipation } from '@/modules/projects/entities/project-participation.entity';
import { SubmissionsController } from './controllers/submissions.controller';
import { Deliverable } from './entities/deliverable.entity';
import { DeliverableSubmission } from './entities/submission.entity';
import { SubmissionsService } from './services/submissions.service';
import { DeliverablesService } from './services/deliverables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Deliverable, DeliverableSubmission, ProjectParticipation])],
  providers: [DeliverablesService, SubmissionsService],
  exports: [DeliverablesService, SubmissionsService],
  controllers: [SubmissionsController]
})
export class ProjectDeliverablesModule {}
