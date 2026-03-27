import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { ProjectParticipation } from '../entities/project-participation.entity';
import { PhasesService } from '../phases/services/phases.service';
import { ProjectParticipationService } from './project-participations.service';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { Phase } from '../phases/entities/phase.entity';

@Injectable()
export class ProjectParticipationReviewService {
  private readonly PROMOTION_SCORE = 60;

  constructor(
    @InjectRepository(ProjectParticipationReview)
    private readonly reviewRepository: Repository<ProjectParticipationReview>,
    private readonly participationService: ProjectParticipationService,
    private readonly phasesService: PhasesService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async review(participationId: string, dto: ParticipationReviewDto): Promise<ProjectParticipationReview> {
    try {
      const participation = await this.participationService.findOne(participationId);
      const phase = await this.phasesService.findOne(dto.phaseId);
      this.ensureParticipationInPhase(participation, dto.phaseId);
      const existing = await this.reviewRepository.findOne({
        where: {
          participation: { id: participationId },
          phase: { id: dto.phaseId }
        }
      });
      const nextPhase = this.findNextPhase(participation.project?.phases ?? [], dto.phaseId, false);
      const review = await this.reviewRepository.save({
        id: existing?.id,
        participation: { id: participationId },
        phase: { id: dto.phaseId },
        message: dto.message ?? null,
        score: dto.score
      });
      await this.promoteToNextPhaseIfEligible(participation, dto.score, nextPhase);
      await this.notifyParticipantIfNeeded(participation, phase, dto, nextPhase);
      return review;
    } catch {
      throw new BadRequestException('Score impossible à enregistrer');
    }
  }

  private ensureParticipationInPhase(participation: ProjectParticipation, phaseId: string): void {
    const inPhase = participation.phases?.some((phase) => phase.id === phaseId);
    if (!inPhase) {
      throw new BadRequestException('Participant absent de la phase');
    }
  }

  private async promoteToNextPhaseIfEligible(
    participation: ProjectParticipation,
    score: number,
    nextPhase: Phase | null
  ): Promise<void> {
    if (score < this.PROMOTION_SCORE) return;
    if (!nextPhase) return;
    const currentPhases = participation.phases ?? [];
    const alreadyInNext = currentPhases.some((phase) => phase.id === nextPhase.id);
    const updatedParticipation: ProjectParticipation = {
      ...participation,
      phases: alreadyInNext ? currentPhases : [...currentPhases, nextPhase]
    };
    await this.participationService.saveMany([updatedParticipation]);
  }

  private findNextPhase(phases: Phase[], currentPhaseId: string, throwWhenMissing = true): Phase | null {
    const sortedPhases = [...phases].sort((a, b) => {
      const left = new Date(a.started_at).getTime();
      const right = new Date(b.started_at).getTime();
      return left - right;
    });
    const currentIndex = sortedPhases.findIndex((phase) => phase.id === currentPhaseId);
    if (currentIndex === -1 && throwWhenMissing) {
      throw new BadRequestException('Phase introuvable dans le projet');
    }
    if (currentIndex === -1) return null;
    return sortedPhases[currentIndex + 1] ?? null;
  }

  private async notifyParticipantIfNeeded(
    participation: ProjectParticipation,
    phase: Phase,
    dto: ParticipationReviewDto,
    nextPhase: Phase | null
  ): Promise<void> {
    if (!dto.notifyParticipant) return;
    this.eventEmitter.emit('participation.review', {
      user: participation.user,
      project: participation.project,
      phase,
      score: dto.score,
      message: dto.message,
      nextPhase: dto.score >= this.PROMOTION_SCORE ? nextPhase : null
    });
  }
}
