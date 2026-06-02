import { Module } from '@nestjs/common';
import { ProjectMediaController } from './controllers/project-media.controller';
import { ProjectNotificationsController } from './controllers/project-notifications.controller';
import { ProjectParticipationsController } from './controllers/project-participations.controller';
import { ProjectParticipationReviewController } from './controllers/project-participation-review.controller';
import { ProjectsController } from './controllers/projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../../notifications/notifications.module';
import { UsersModule } from '../../identity/users/users.module';
import { VenturesModule } from '../../ventures/ventures/ventures.module';
import { Project } from './entities/project.entity';
import { ProjectParticipation } from './entities/project-participation.entity';
import { ProjectParticipationReview } from './entities/project-participation-review.entity';
import { ProjectParticipationUpvote } from './entities/participation-upvote.entity';
import { ProjectCategoriesModule } from '../../projects/categories/categories.module';
import { PhasesModule } from '../../projects/phases/phases.module';
import { ProjectMediaService } from './services/project-media.service';
import { ProjectParticipationService } from './services/project-participations.service';
import { ProjectParticipationReviewService } from './services/project-participation-review.service';
import { ProjectNotificationService } from './services/project-notifications.service';
import { ProjectsEmailService } from './services/projects-email.service';
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
  providers: [
    ProjectsService,
    ProjectParticipationService,
    ProjectParticipationReviewService,
    ProjectNotificationService,
    ProjectMediaService,
    ProjectsEmailService,
    ProjectSubscriber
  ],
  controllers: [
    ProjectsController,
    ProjectParticipationsController,
    ProjectParticipationReviewController,
    ProjectNotificationsController,
    ProjectMediaController
  ],
  exports: [ProjectsService]
})
export class ProjectsModule {}
