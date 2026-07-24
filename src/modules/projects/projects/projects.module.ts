import { Module } from '@nestjs/common';
import { ProjectsController } from './controllers/projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../../notifications/notifications.module';
import { UsersModule } from '@/modules/users/users.module';
import { VenturesModule } from '../../ventures/ventures/ventures.module';
import { Project } from './entities/project.entity';
import { ProjectParticipation } from './entities/project-participation.entity';
import { ProjectParticipationReview } from './entities/project-participation-review.entity';
import { ProjectParticipationUpvote } from './entities/participation-upvote.entity';
import { ProjectCategoriesModule } from '../../projects/categories/categories.module';
import { PhasesModule } from '../../projects/phases/phases.module';
import { ProjectsService } from './services/projects.service';
import { ProjectSubscriber } from './subscribers/project.subscriber';
import { MentorsModule } from '../../mentors/mentors/mentors.module';
import { GalleriesModule } from '../../galleries/galleries.module';

@Module({
  imports: [
    GalleriesModule,
    NotificationsModule,
    PhasesModule,
    MentorsModule,
    ProjectCategoriesModule,
    UsersModule,
    VenturesModule,
    TypeOrmModule.forFeature([Project, ProjectParticipation, ProjectParticipationUpvote, ProjectParticipationReview])
  ],
  providers: [ProjectsService, ProjectSubscriber],
  controllers: [ProjectsController],
  exports: [ProjectsService]
})
export class ProjectsModule {}
