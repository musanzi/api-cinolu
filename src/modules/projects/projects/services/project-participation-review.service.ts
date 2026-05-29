import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../../identity/users/entities/user.entity';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { ProjectParticipation } from '../entities/project-participation.entity';
import { PhasesService } from '../../../projects/phases/services/phases.service';
import { ProjectParticipationService } from './project-participations.service';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { Phase } from '../../../projects/phases/entities/phase.entity';
import { UpdateParticipationReviewDto } from '../dto/update-participation-review.dto';

@Injectable()
export class ProjectParticipationReviewService {
  private readonly PROMOTION_SCORE = 60;

  constructor(
    @InjectRepository(ProjectParticipationReview)
    private readonly reviewRepository: Repository<ProjectParticipationReview>,
    @Inject(forwardRef(() => ProjectParticipationService))
    private readonly participationService: ProjectParticipationService,
    private readonly phasesService: PhasesService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async removeHistoryForPhase(participationIds: string[], phaseId: string): Promise<void> {
    try {
      await this.reviewRepository.delete({
        participation: { id: In(participationIds) },
        phase: { id: phaseId }
      });
    } catch {
      throw new BadRequestException("Suppression de l'historique impossible");
    }
  }

  async createReview(
    participationId: string,
    reviewer: User,
    dto: ParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
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
      if (existing) {
        throw new BadRequestException('Avis déjà enregistré');
      }
      const nextPhase = this.findNextPhase(participation.project?.phases ?? [], dto.phaseId, false);
      const review = await this.reviewRepository.save({
        participation: { id: participationId },
        phase: { id: dto.phaseId },
        reviewer: { id: reviewer.id },
        message: dto.message ?? null,
        score: dto.score
      });
      await this.updateParticipationPhases(participation, dto.score, false, nextPhase);
      await this.notifyParticipantIfNeeded(participation, phase, dto, nextPhase);
      return review;
    } catch {
      throw new BadRequestException('Score impossible à enregistrer');
    }
  }

  async updateReview(
    participationId: string,
    reviewId: string,
    reviewer: User,
    dto: UpdateParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    try {
      const participation = await this.participationService.findOne(participationId);
      const existing = await this.findReview(reviewId, participationId);
      const phase = await this.phasesService.findOne(existing.phase.id);
      this.ensureParticipationInPhase(participation, existing.phase.id);
      const nextPhase = this.findNextPhase(participation.project?.phases ?? [], existing.phase.id, false);
      const review = await this.reviewRepository.save({
        id: existing.id,
        participation: { id: participationId },
        phase: { id: existing.phase.id },
        reviewer: { id: reviewer.id },
        message: dto.message ?? null,
        score: dto.score
      });
      await this.updateParticipationPhases(participation, dto.score, true, nextPhase);
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

  private async findReview(reviewId: string, participationId: string): Promise<ProjectParticipationReview> {
    try {
      return await this.reviewRepository.findOneOrFail({
        where: { id: reviewId, participation: { id: participationId } },
        relations: ['phase']
      });
    } catch {
      throw new BadRequestException('Avis introuvable');
    }
  }

  private async updateParticipationPhases(
    participation: ProjectParticipation,
    score: number,
    hasExistingReview: boolean,
    nextPhase: Phase | null
  ): Promise<void> {
    const currentPhases = participation.phases ?? [];

    if (hasExistingReview && score < this.PROMOTION_SCORE) {
      if (!nextPhase) return;
      const updatedPhases = currentPhases.filter((phase) => phase.id !== nextPhase.id);
      if (updatedPhases.length === currentPhases.length) return;
      const updatedParticipation: ProjectParticipation = {
        ...participation,
        phases: updatedPhases
      };
      await this.participationService.saveMany([updatedParticipation]);
      return;
    }
    if (score < this.PROMOTION_SCORE) return;
    if (!nextPhase) return;
    const alreadyInNext = currentPhases.some((phase) => phase.id === nextPhase.id);
    if (alreadyInNext) return;
    const updatedParticipation: ProjectParticipation = {
      ...participation,
      phases: [...currentPhases, nextPhase]
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
    dto: ParticipationReviewDto | UpdateParticipationReviewDto,
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
