import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { ProjectParticipationReviewService } from '../services/project-participation-review.service';
import { UpdateParticipationReviewDto } from '../dto/update-participation-review.dto';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('projects')
export class ProjectParticipationReviewController {
  constructor(private readonly reviewService: ProjectParticipationReviewService) {}

  @Post('participations/:participationId/review')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  createReview(
    @Param('participationId') participationId: string,
    @CurrentUser() user: User,
    @Body() dto: ParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.reviewService.createReview(participationId, user.id, dto);
  }

  @Patch('participations/:participationId/review/:reviewId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  updateReview(
    @Param('participationId') participationId: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.reviewService.updateReview(participationId, reviewId, user.id, dto);
  }
}
