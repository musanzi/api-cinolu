import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { ProjectParticipationReviewService } from '../services/project-participation-review.service';

@Controller('projects')
export class ProjectParticipationReviewController {
  constructor(private readonly reviewService: ProjectParticipationReviewService) {}

  @Patch('participations/:participationId/review')
  @Rbac({ resource: 'projects', action: 'update' })
  review(
    @Param('participationId') participationId: string,
    @Body() dto: ParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.reviewService.review(participationId, dto);
  }
}
