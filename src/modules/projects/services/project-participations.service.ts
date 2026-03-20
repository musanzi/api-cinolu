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

@Injectable()
export class ProjectParticipationService {
  constructor(
    @InjectRepository(ProjectParticipation)
    private readonly participationRepository: Repository<ProjectParticipation>,
    @InjectRepository(ProjectParticipationUpvote)
    private readonly upvoteRepository: Repository<ProjectParticipationUpvote>,
    private readonly usersService: UsersService,
    private readonly phasesService: PhasesService,
    private readonly venturesService: VenturesService,
    private readonly projectsService: ProjectsService
  ) {}

  async findUserParticipations(userId: string): Promise<ProjectParticipation[]> {
    try {
      return await this.participationRepository.find({
        where: { user: { id: userId } },
        relations: ['project', 'project.phases', 'phases', 'venture']
      });
    } catch {
      throw new BadRequestException('Participations introuvables');
    }
  }

  async moveParticipants(dto: MoveParticipantsDto): Promise<void> {
    try {
      const phase = await this.phasesService.findOne(dto.phaseId);
      const participations = await this.participationRepository.find({
        where: { id: In(dto.ids) },
        relations: ['phases']
      });
      for (const participation of participations) {
        const alreadyInPhase = participation.phases?.some((entry) => entry.id === phase.id);
        if (alreadyInPhase) continue;
        participation.phases = [...(participation.phases ?? []), phase];
        await this.participationRepository.save(participation);
      }
    } catch {
      throw new BadRequestException('Déplacement impossible');
    }
  }

  async removeParticipantsFromPhase(dto: MoveParticipantsDto): Promise<void> {
    try {
      const participations = await this.participationRepository.find({
        where: { id: In(dto.ids) },
        relations: ['phases']
      });
      for (const participation of participations) {
        participation.phases = (participation.phases ?? []).filter((phase) => phase.id !== dto.phaseId);
        await this.participationRepository.save(participation);
      }
    } catch {
      throw new BadRequestException('Retrait impossible');
    }
  }

  async findParticipations(
    projectId: string,
    queryParams: FilterParticipationsDto
  ): Promise<[ProjectParticipation[], number]> {
    try {
      const { page = 1, q, phaseId } = queryParams;
      const skip = (+page - 1) * 20;
      const query = this.participationRepository
        .createQueryBuilder('pp')
        .leftJoinAndSelect('pp.user', 'user')
        .leftJoinAndSelect('pp.venture', 'venture')
        .leftJoinAndSelect('pp.project', 'project')
        .leftJoinAndSelect('pp.phases', 'phases')
        .loadRelationCountAndMap('pp.upvotesCount', 'pp.upvotes')
        .where('pp.projectId = :projectId', { projectId })
        .orderBy('pp.created_at', 'DESC');
      if (q) query.andWhere('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      if (phaseId) query.andWhere('phases.id = :phaseId', { phaseId });
      return await query.skip(skip).take(20).getManyAndCount();
    } catch {
      throw new BadRequestException('Participations introuvables');
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
      throw new BadRequestException('Participants introuvables');
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
      throw new BadRequestException('Participants introuvables');
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
        .loadRelationCountAndMap('pp.upvotesCount', 'pp.upvotes')
        .where('pp.id = :participationId', { participationId })
        .getOneOrFail();
    } catch {
      throw new NotFoundException('Participation introuvable');
    }
  }

  async importParticipants(projectId: string, file: Express.Multer.File): Promise<void> {
    try {
      const project = await this.projectsService.findOneWithParticipations(projectId);
      const rows = await parseUsersCsv(file.buffer);
      const existingUserIds = new Set<string>(
        project.participations?.map((participation) => participation?.user?.id) ?? []
      );
      const newUserIds = new Set<string>();
      for (const row of rows) {
        const user = await this.usersService.findOrCreate(row);
        if (!existingUserIds.has(user?.id)) {
          newUserIds.add(user?.id);
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
      throw new BadRequestException('Import des participants impossible');
    }
  }

  private mapUniqueUsers(participations: ProjectParticipation[]): User[] {
    const seen = new Set<string>();
    return participations
      .map((participation) => participation?.user)
      .filter((participant) => {
        if (seen.has(participant?.id)) return false;
        seen.add(participant?.id);
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
      throw new BadRequestException('Participation impossible');
    }
  }

  async upvote(id: string, userId: string): Promise<void> {
    try {
      await this.upvoteRepository.save({
        participation: { id },
        user: { id: userId }
      });
    } catch {
      throw new BadRequestException('Vote impossible');
    }
  }

  async unvote(id: string, userId: string): Promise<void> {
    try {
      const upvote = await this.upvoteRepository.findOneOrFail({
        where: { participation: { id }, user: { id: userId } }
      });
      await this.upvoteRepository.remove(upvote);
    } catch {
      throw new BadRequestException('Retrait du vote impossible');
    }
  }
}
