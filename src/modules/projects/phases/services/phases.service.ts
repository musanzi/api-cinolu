import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from '../entities/phase.entity';
import { DeliverablesService } from '../deliverables/services/deliverables.service';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class PhasesService extends AbstractRepository<Phase> {
  constructor(
    @InjectRepository(Phase)
    repository: Repository<Phase>,
    private readonly deliverablesService: DeliverablesService
  ) {
    super(repository);
  }

  async create(projectId: string, dto: CreatePhaseDto): Promise<Phase> {
    try {
      const { deliverables, mentors, ...phaseData } = dto;
      const phase = await this.createEntity({
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
    return await this.findEntity({
      where: { id: phaseId },
      relations: ['participations', 'participations.user', 'deliverables', 'mentors', 'mentors.owner']
    });
  }

  async update(phaseId: string, updatePhaseDto: UpdatePhaseDto): Promise<Phase> {
    try {
      const { deliverables, mentors, ...phaseData } = updatePhaseDto;
      await this.updateEntity(phaseId, {
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
      return await this.repository
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
    await this.deleteEntity(id);
  }
}
