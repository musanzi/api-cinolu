import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from '../entities/phase.entity';
import { DeliverablesService } from '../deliverables/services/deliverables.service';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    private readonly deliverablesService: DeliverablesService
  ) {}

  async create(projectId: string, dto: CreatePhaseDto): Promise<Phase> {
    try {
      const { deliverables, mentors, ...phaseData } = dto;
      const phase = await this.phaseRepository.save({
        ...phaseData,
        project: { id: projectId },
        mentors: mentors?.map((id) => ({ id }))
      });
      await this.deliverablesService.create(phase.id, deliverables);
      return await this.findOne(phase.id);
    } catch {
      throw new BadRequestException('Création de phase impossible');
    }
  }

  async findOne(phaseId: string): Promise<Phase> {
    try {
      return await this.phaseRepository.findOneOrFail({
        where: { id: phaseId },
        relations: ['participations', 'participations.user', 'deliverables', 'mentors', 'mentors.owner']
      });
    } catch {
      throw new NotFoundException('Phase introuvable');
    }
  }

  async update(phaseId: string, updatePhaseDto: UpdatePhaseDto): Promise<Phase> {
    try {
      const { deliverables, mentors, ...phaseData } = updatePhaseDto;
      const phase = await this.findOne(phaseId);
      await this.phaseRepository.save({
        ...phase,
        ...phaseData,
        mentors: mentors?.map((id) => ({ id })) || []
      });
      await this.deliverablesService.sync(phaseId, deliverables);
      return await this.findOne(phaseId);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async findAll(projectId: string): Promise<Phase[]> {
    try {
      return await this.phaseRepository
        .createQueryBuilder('phase')
        .where('phase.projectId = :projectId', { projectId })
        .leftJoinAndSelect('phase.deliverables', 'deliverables')
        .leftJoinAndSelect('phase.mentors', 'mentors')
        .leftJoinAndSelect('mentors.owner', 'owner')
        .loadRelationCountAndMap('phase.participationsCount', 'phase.participations')
        .getMany();
    } catch {
      throw new BadRequestException('Phases introuvables');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.phaseRepository.softDelete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
