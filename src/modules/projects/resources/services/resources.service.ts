import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { FilterResourcesInterface } from '../interfaces/filter-resources.interface';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { Resource } from '../entities/resource.entity';
import { ProjectsService } from '../../../projects/projects/services/projects.service';
import { PhasesService } from '../../../projects/phases/services/phases.service';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';

@Injectable()
export class ResourcesService extends AbstractRepository<Resource> {
  constructor(
    @InjectRepository(Resource)
    repository: Repository<Resource>,
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService
  ) {
    super(repository);
  }

  async create(dto: CreateResourceDto, file: Express.Multer.File): Promise<Resource> {
    return await this.createEntity({
      ...dto,
      file: file.filename,
      project: { id: dto.project_id },
      phase: { id: dto.phase_id }
    });
  }

  async findByProject(projectId: string, queryParams: FilterResourcesInterface): Promise<[Resource[], number]> {
    try {
      await this.projectsService.findOne(projectId);
      return await this.buildScopedQuery('r.projectId = :scopeId', projectId, queryParams).getManyAndCount();
    } catch {
      throw new NotFoundException('Ressources introuvables');
    }
  }

  async findByPhase(phaseId: string, queryParams: FilterResourcesInterface): Promise<[Resource[], number]> {
    try {
      await this.phasesService.findOne(phaseId);
      return await this.buildScopedQuery('r.phaseId = :scopeId', phaseId, queryParams).getManyAndCount();
    } catch {
      throw new NotFoundException('Ressources introuvables');
    }
  }

  async findOne(id: string): Promise<Resource> {
    return await this.findEntity({ where: { id }, relations: ['project', 'phase'] });
  }

  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    return await this.updateEntity(id, dto);
  }

  async setFile(id: string, file: string): Promise<Resource> {
    return await this.updateEntity(id, { file });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  private buildScopedQuery(
    scopeCondition: string,
    scopeId: string,
    queryParams: FilterResourcesInterface
  ): SelectQueryBuilder<Resource> {
    const { page = 1, category } = queryParams;
    const skip = (+page - 1) * 20;
    const query = this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.project', 'project')
      .leftJoinAndSelect('r.phase', 'phase')
      .where(scopeCondition, { scopeId });
    if (category) query.andWhere('r.category = :category', { category });
    return query.orderBy('r.updated_at', 'DESC').skip(skip).take(20);
  }
}
