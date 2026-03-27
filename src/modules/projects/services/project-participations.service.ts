import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectParticipation } from '../entities/project-participation.entity';
import { ProjectParticipationUpvote } from '../entities/participation-upvote.entity';
import { UsersService } from '@/modules/users/services/users.service';
import { VenturesService } from '@/modules/ventures/services/ventures.service';
import { User } from '@/modules/users/entities/user.entity';
import { ParticipateProjectDto } from '../dto/participate.dto';
import { ProjectsService } from './projects.service';
import { MoveParticipantsDto } from '../dto/move-participants.dto';
import { PhasesService } from '../phases/services/phases.service';
import { parseUsersCsv } from '@/core/helpers/user-csv.helper';
import { FilterParticipationsDto } from '../dto/filter-participations.dto';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';

@Injectable()
export class ProjectParticipationService {
  private readonly PAGINATION_LIMIT = 20;

  constructor(
    @InjectRepository(ProjectParticipation)
    private readonly participationRepository: Repository<ProjectParticipation>,
    @InjectRepository(ProjectParticipationUpvote)
    private readonly upvoteRepository: Repository<ProjectParticipationUpvote>,
    @InjectRepository(ProjectParticipationReview)
    private readonly reviewRepository: Repository<ProjectParticipationReview>,
    private readonly usersService: UsersService,
    private readonly phasesService: PhasesService,
    private readonly venturesService: VenturesService,
    private readonly projectsService: ProjectsService
  ) {}

  async findUserParticipations(userId: string): Promise<ProjectParticipation[]> {
    try {
      return await this.participationRepository.find({
        where: { user: { id: userId } },
        relations: ['project', 'project.phases', 'phases', 'venture', 'reviews', 'reviews.phase']
      });
    } catch {
      throw new BadRequestException("Impossible de récupérer les participations de l'utilisateur");
    }
  }

  async moveParticipants(dto: MoveParticipantsDto): Promise<void> {
    try {
      const phase = await this.phasesService.findOne(dto.phaseId);
      const participations = await this.participationRepository.find({
        where: { id: In(dto.ids) },
        relations: ['phases']
      });
      const toUpdate = participations.filter((participation) => {
        const alreadyInPhase = participation.phases?.some((entry) => entry.id === phase.id);
        if (!alreadyInPhase) {
          participation.phases = [...(participation.phases ?? []), phase];
          return true;
        }
        return false;
      });
      if (toUpdate.length > 0) {
        await this.participationRepository.save(toUpdate);
      }
    } catch {
      throw new BadRequestException('Impossible de déplacer les participants vers la phase');
    }
  }

  async removeParticipantsFromPhase(dto: MoveParticipantsDto): Promise<void> {
    try {
      const participations = await this.participationRepository.find({
        where: { id: In(dto.ids) },
        relations: ['phases']
      });
      participations.forEach((participation) => {
        participation.phases = (participation.phases ?? []).filter((phase) => phase.id !== dto.phaseId);
      });
      await this.participationRepository.save(participations);
      await this.reviewRepository.delete({
        participation: { id: In(dto.ids) },
        phase: { id: dto.phaseId }
      });
    } catch {
      throw new BadRequestException('Impossible de retirer les participants de la phase');
    }
  }

  async saveMany(participations: ProjectParticipation[]): Promise<void> {
    try {
      await this.participationRepository.save(participations);
    } catch {
      throw new BadRequestException('Mise à jour des participants impossible');
    }
  }

  async findParticipations(
    projectId: string,
    queryParams: FilterParticipationsDto
  ): Promise<[ProjectParticipation[], number]> {
    try {
      const { page = 1, phaseId, q } = queryParams;
      const skip = (+page - 1) * this.PAGINATION_LIMIT;
      const query = this.participationRepository
        .createQueryBuilder('pp')
        .leftJoinAndSelect('pp.user', 'user')
        .leftJoinAndSelect('pp.venture', 'venture')
        .leftJoinAndSelect('pp.project', 'project')
        .leftJoinAndSelect('pp.phases', 'phases')
        .leftJoinAndSelect('pp.reviews', 'reviews')
        .leftJoinAndSelect('reviews.phase', 'review_phase')
        .loadRelationCountAndMap('pp.upvotesCount', 'pp.upvotes')
        .where('pp.projectId = :projectId', { projectId })
        .orderBy('pp.created_at', 'DESC')
        .distinct(true);
      if (q) query.andWhere('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      if (phaseId) query.andWhere('phases.id = :phaseId', { phaseId });
      return await query.skip(skip).take(this.PAGINATION_LIMIT).getManyAndCount();
    } catch {
      throw new BadRequestException('Impossible de récupérer les participations du projet');
    }
  }

  async findByProject(projectId: string): Promise<User[]> {
    try {
      await this.projectsService.findOne(projectId);
      const participations = await this.participationRepository.find({
        where: { project: { id: projectId } },
        relations: ['user']
      });
      return this.mapUniqueUsers(participations);
    } catch {
      throw new BadRequestException('Impossible de récupérer les participants du projet');
    }
  }

  async findByPhase(phaseId: string): Promise<User[]> {
    try {
      const participations = await this.participationRepository.find({
        where: { phases: { id: phaseId } },
        relations: ['user']
      });
      return this.mapUniqueUsers(participations);
    } catch {
      throw new BadRequestException('Impossible de récupérer les participants de la phase');
    }
  }

  async findOne(participationId: string): Promise<ProjectParticipation> {
    try {
      return await this.participationRepository
        .createQueryBuilder('pp')
        .leftJoinAndSelect('pp.user', 'user')
        .leftJoinAndSelect('pp.venture', 'venture')
        .leftJoinAndSelect('pp.project', 'project')
        .leftJoinAndSelect('project.categories', 'categories')
        .leftJoinAndSelect('project.phases', 'project_phases')
        .leftJoinAndSelect('pp.phases', 'phases')
        .leftJoinAndSelect('pp.reviews', 'reviews')
        .leftJoinAndSelect('reviews.phase', 'review_phase')
        .loadRelationCountAndMap('pp.upvotesCount', 'pp.upvotes')
        .where('pp.id = :participationId', { participationId })
        .getOneOrFail();
    } catch {
      throw new NotFoundException('Participation introuvable');
    }
  }

  async ensureExists(participationId: string): Promise<void> {
    try {
      await this.participationRepository.findOneOrFail({ where: { id: participationId } });
    } catch {
      throw new NotFoundException('Participation introuvable');
    }
  }

  async importParticipants(projectId: string, file: Express.Multer.File): Promise<void> {
    try {
      const project = await this.projectsService.findOneWithParticipations(projectId);
      const rows = await parseUsersCsv(file.buffer);
      const existingUserIds = new Set<string>(
        project.participations?.map((participation) => participation?.user?.id).filter(Boolean) ?? []
      );
      const newUserIds = new Set<string>();
      for (const row of rows) {
        const user = await this.usersService.findOrCreate(row);
        if (user?.id && !existingUserIds.has(user.id)) {
          newUserIds.add(user.id);
        }
      }
      if (newUserIds.size === 0) return;
      await this.participationRepository.save(
        [...newUserIds].map((userId) => ({
          created_at: project.started_at,
          user: { id: userId },
          project: { id: projectId }
        }))
      );
    } catch {
      throw new BadRequestException("Impossible d'importer les participants");
    }
  }

  private mapUniqueUsers(participations: ProjectParticipation[]): User[] {
    const seen = new Set<string>();
    return participations
      .map((participation) => participation?.user)
      .filter((user) => !!user)
      .filter((user) => {
        if (seen.has(user.id)) return false;
        seen.add(user.id);
        return true;
      });
  }

  async participate(projectId: string, user: User, dto: ParticipateProjectDto): Promise<void> {
    try {
      await this.projectsService.findOne(projectId);
      const venture = await this.venturesService.findOne(dto.ventureId);
      await this.participationRepository.save({
        user: { id: user.id },
        project: { id: projectId },
        venture: venture ? { id: venture.id } : null
      });
    } catch {
      throw new BadRequestException('Impossible de participer au projet');
    }
  }

  async upvote(id: string, userId: string): Promise<void> {
    try {
      await this.upvoteRepository.save({
        participation: { id },
        user: { id: userId }
      });
    } catch {
      throw new BadRequestException('Impossible de voter pour cette participation');
    }
  }

  async unvote(id: string, userId: string): Promise<void> {
    try {
      const upvote = await this.upvoteRepository.findOneOrFail({
        where: { participation: { id }, user: { id: userId } }
      });
      await this.upvoteRepository.remove(upvote);
    } catch {
      throw new BadRequestException('Impossible de retirer le vote');
    }
  }
}
