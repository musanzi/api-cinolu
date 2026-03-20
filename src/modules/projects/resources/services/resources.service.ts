import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { FilterResourcesDto } from '../dto/filter-resources.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { Resource } from '../entities/resource.entity';
import { ProjectsService } from '@/modules/projects/services/projects.service';
import { PhasesService } from '@/modules/projects/phases/services/phases.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService
  ) {}

  async create(dto: CreateResourceDto, file: Express.Multer.File): Promise<Resource> {
    try {
      const resource = this.resourceRepository.create({
        ...dto,
        file: file.filename,
        project: { id: dto.project_id },
        phase: { id: dto.phase_id }
      });
      return await this.resourceRepository.save(resource);
    } catch {
      throw new BadRequestException('Création de ressource impossible');
    }
  }

  async findByProject(projectId: string, queryParams: FilterResourcesDto): Promise<[Resource[], number]> {
    try {
      await this.projectsService.findOne(projectId);
      return await this.buildScopedQuery('r.projectId = :scopeId', projectId, queryParams).getManyAndCount();
    } catch {
      throw new NotFoundException('Ressources introuvables');
    }
  }

  async findByPhase(phaseId: string, queryParams: FilterResourcesDto): Promise<[Resource[], number]> {
    try {
      await this.phasesService.findOne(phaseId);
      return await this.buildScopedQuery('r.phaseId = :scopeId', phaseId, queryParams).getManyAndCount();
    } catch {
      throw new NotFoundException('Ressources introuvables');
    }
  }

  async findOne(id: string): Promise<Resource> {
    try {
      return await this.resourceRepository.findOneOrFail({
        where: { id },
        relations: ['project', 'phase']
      });
    } catch {
      throw new NotFoundException('Ressource introuvable');
    }
  }

  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    try {
      const resource = await this.findOne(id);
      return await this.resourceRepository.save({ ...resource, ...dto });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async setFile(id: string, file: string): Promise<Resource> {
    try {
      const resource = await this.findOne(id);
      return await this.resourceRepository.save({ ...resource, file });
    } catch {
      throw new BadRequestException('Mise à jour du fichier impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.resourceRepository.softDelete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }

  private buildScopedQuery(
    scopeCondition: string,
    scopeId: string,
    queryParams: FilterResourcesDto
  ): SelectQueryBuilder<Resource> {
    const { page = 1, category } = queryParams;
    const skip = (+page - 1) * 20;
    const query = this.resourceRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.project', 'project')
      .leftJoinAndSelect('r.phase', 'phase')
      .where(scopeCondition, { scopeId });
    if (category) query.andWhere('r.category = :category', { category });
    return query.orderBy('r.updated_at', 'DESC').skip(skip).take(20);
  }
}
