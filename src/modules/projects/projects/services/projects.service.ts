import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { FilterProjectsInterface } from '../interfaces/filter-projects.interface';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class ProjectsService extends AbstractRepository<Project> {
  constructor(
    @InjectRepository(Project)
    repository: Repository<Project>
  ) {
    super(repository);
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    return await this.createEntity({
      ...dto,
      project_manager: { id: dto.project_manager },
      program: { id: dto.program },
      categories: dto.categories.map((id) => ({ id }))
    });
  }

  async findAll(queryParams: FilterProjectsInterface): Promise<[Project[], number]> {
    const { page, categories, q, filter = 'all' } = queryParams;
    const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
    const query = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categories', 'categories')
      .loadRelationCountAndMap('p.participantsCount', 'p.participations')
      .orderBy('p.updated_at', 'DESC');
    if (filter === 'published') query.andWhere('p.is_published = :isPublished', { isPublished: true });
    if (filter === 'drafts') query.andWhere('p.is_published = :isPublished', { isPublished: false });
    if (filter === 'highlighted') query.andWhere('p.is_highlighted = :isHighlighted', { isHighlighted: true });
    if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
    if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
    return await this.findPaginatedEntities(query, { page, take: 20 });
  }

  async findPublished(queryParams: FilterProjectsInterface): Promise<[Project[], number]> {
    try {
      const { page, categories, q, status } = queryParams;
      const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
      const query = this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .andWhere('p.is_published = :is_published', { is_published: true });
      if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
      if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
      if (status === 'past') query.andWhere('p.ended_at < NOW()');
      if (status === 'current') query.andWhere('p.started_at <= NOW() AND p.ended_at >= NOW()');
      if (status === 'future') query.andWhere('p.started_at > NOW()');
      return await this.findPaginatedEntities(query.orderBy('p.started_at', 'DESC'), { page, take: 40 });
    } catch {
      throw new BadRequestException('Projets publiés introuvables');
    }
  }

  async findMentorProjects(userId: string): Promise<Project[]> {
    try {
      return await this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .leftJoinAndSelect('p.phases', 'phases')
        .leftJoinAndSelect('phases.mentors', 'mentors')
        .leftJoinAndSelect('mentors.owner', 'owner')
        .loadRelationCountAndMap('p.participantsCount', 'p.participations')
        .where('owner.id = :userId', { userId })
        .orderBy('p.updated_at', 'DESC')
        .addOrderBy('phases.started_at', 'ASC')
        .getMany();
    } catch {
      throw new BadRequestException('Projets mentorés introuvables');
    }
  }

  async findRecent(): Promise<Project[]> {
    return await this.findEntities({ order: { ended_at: 'DESC' }, where: { is_published: true }, take: 6 });
  }

  async findBySlug(slug: string): Promise<Project> {
    try {
      return await this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .leftJoinAndSelect('p.project_manager', 'project_manager')
        .leftJoinAndSelect('p.program', 'program')
        .leftJoinAndSelect('p.gallery', 'gallery')
        .leftJoinAndSelect('p.phases', 'phases')
        .leftJoinAndSelect('phases.mentors', 'mentors')
        .leftJoinAndSelect('mentors.owner', 'owner')
        .leftJoinAndSelect('phases.deliverables', 'deliverables')
        .loadRelationCountAndMap('phases.participationsCount', 'phases.participations')
        .where('p.slug = :slug', { slug })
        .orderBy('phases.started_at', 'ASC')
        .getOneOrFail();
    } catch {
      throw new NotFoundException('Projet introuvable');
    }
  }

  async findOne(projectId: string): Promise<Project> {
    return await this.findEntity({
      where: { id: projectId },
      relations: ['categories', 'project_manager', 'gallery']
    });
  }

  async findOneWithParticipations(projectId: string): Promise<Project> {
    return await this.findEntity({ where: { id: projectId }, relations: ['participations', 'participations.user'] });
  }

  async toggleHighlight(projectId: string): Promise<Project> {
    const project = await this.findEntity({ where: { id: projectId } });
    return await this.updateEntity(projectId, { is_highlighted: !project.is_highlighted });
  }

  async togglePublish(projectId: string): Promise<Project> {
    const project = await this.findEntity({ where: { id: projectId } });
    return await this.updateEntity(projectId, { is_published: !project.is_published });
  }

  async addCover(projectId: string, cover: string): Promise<Project> {
    return await this.updateEntity(projectId, { cover });
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    return await this.updateEntity(id, {
      ...dto,
      ...(dto.project_manager && { project_manager: { id: dto.project_manager } }),
      ...(dto.program && { program: { id: dto.program } }),
      ...(dto.categories && { categories: dto.categories.map((type) => ({ id: type })) })
    });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
