import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Rbac } from '@musanzi/nestjs-session-auth';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { ProjectParticipationReviewService } from '../services/project-participation-review.service';
import { User } from '../../../identity/users/entities/user.entity';
import { UpdateParticipationReviewDto } from '../dto/update-participation-review.dto';

@Controller('projects')
export class ProjectParticipationReviewController {
  constructor(private readonly reviewService: ProjectParticipationReviewService) {}

  @Post('participations/:participationId/review')
  @Rbac({ resource: 'projects', action: 'update' })
  createReview(
    @Param('participationId') participationId: string,
    @CurrentUser() user: User,
    @Body() dto: ParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.reviewService.createReview(participationId, user, dto);
  }

  @Patch('participations/:participationId/review/:reviewId')
  @Rbac({ resource: 'projects', action: 'update' })
  updateReview(
    @Param('participationId') participationId: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.reviewService.updateReview(participationId, reviewId, user, dto);
  }
}
