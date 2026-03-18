import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { FilterProjectsDto } from '../dto/filter-projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    try {
      const project = this.projectRepository.create({
        ...dto,
        project_manager: { id: dto.project_manager },
        program: { id: dto.program },
        categories: dto.categories.map((id) => ({ id }))
      });
      return await this.projectRepository.save(project);
    } catch {
      throw new BadRequestException();
    }
  }

  async findAll(queryParams: FilterProjectsDto): Promise<[Project[], number]> {
    try {
      const { page = 1, categories, q, filter = 'all' } = queryParams;
      const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
      const skip = (+page - 1) * 20;
      const query = this.projectRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .loadRelationCountAndMap('p.participantsCount', 'p.participations')
        .orderBy('p.updated_at', 'DESC');
      if (filter === 'published') query.andWhere('p.is_published = :isPublished', { isPublished: true });
      if (filter === 'drafts') query.andWhere('p.is_published = :isPublished', { isPublished: false });
      if (filter === 'highlighted') query.andWhere('p.is_highlighted = :isHighlighted', { isHighlighted: true });
      if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
      if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
      return await query.skip(skip).take(20).getManyAndCount();
    } catch {
      throw new BadRequestException();
    }
  }

  async findPublished(queryParams: FilterProjectsDto): Promise<[Project[], number]> {
    try {
      const { page = 1, categories, q, status } = queryParams;
      const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
      const skip = (+page - 1) * 40;
      const query = this.projectRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .andWhere('p.is_published = :is_published', { is_published: true });
      if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
      if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
      if (status === 'past') query.andWhere('p.ended_at < NOW()');
      if (status === 'current') query.andWhere('p.started_at <= NOW() AND p.ended_at >= NOW()');
      if (status === 'future') query.andWhere('p.started_at > NOW()');
      return await query.skip(skip).take(40).orderBy('p.started_at', 'DESC').getManyAndCount();
    } catch {
      throw new BadRequestException();
    }
  }

  async findMentorProjects(userId: string): Promise<Project[]> {
    try {
      return await this.projectRepository
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.categories', 'categories')
        .leftJoinAndSelect('project.project_manager', 'project_manager')
        .leftJoinAndSelect('project.program', 'subprogram')
        .leftJoinAndSelect('subprogram.program', 'program')
        .leftJoinAndSelect('project.phases', 'phases')
        .leftJoinAndSelect('phases.mentors', 'mentors')
        .leftJoinAndSelect('mentors.owner', 'owner')
        .loadRelationCountAndMap('project.participantsCount', 'project.participations')
        .where('owner.id = :userId', { userId })
        .orderBy('project.updated_at', 'DESC')
        .addOrderBy('phases.started_at', 'ASC')
        .getMany();
    } catch {
      throw new BadRequestException();
    }
  }

  // async findMentorProject(projectId: string, userId: string): Promise<Project> {
  //   try {
  //     return await this.projectRepository
  //       .createQueryBuilder('project')
  //       .distinct(true)
  //       .leftJoinAndSelect('project.categories', 'categories')
  //       .leftJoinAndSelect('project.project_manager', 'project_manager')
  //       .leftJoinAndSelect('project.program', 'subprogram')
  //       .leftJoinAndSelect('subprogram.program', 'program')
  //       .leftJoinAndSelect('project.gallery', 'gallery')
  //       .leftJoinAndSelect('project.phases', 'phases')
  //       .leftJoinAndSelect('phases.mentors', 'mentors')
  //       .leftJoinAndSelect('mentors.owner', 'owner')
  //       .leftJoinAndSelect('phases.deliverables', 'deliverables')
  //       .loadRelationCountAndMap('project.participantsCount', 'project.participations')
  //       .loadRelationCountAndMap('phases.participationsCount', 'phases.participations')
  //       .where('project.id = :projectId', { projectId })
  //       .andWhere('owner.id = :userId', { userId })
  //       .orderBy('phases.started_at', 'ASC')
  //       .getOneOrFail();
  //   } catch {
  //     throw new NotFoundException();
  //   }
  // }

  async findRecent(): Promise<Project[]> {
    try {
      return await this.projectRepository.find({
        order: { ended_at: 'DESC' },
        where: { is_published: true },
        take: 6
      });
    } catch {
      throw new BadRequestException();
    }
  }

  async findBySlug(slug: string): Promise<Project> {
    try {
      return await this.projectRepository
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
      throw new NotFoundException();
    }
  }

  async findOne(projectId: string): Promise<Project> {
    try {
      return await this.projectRepository.findOneOrFail({
        where: { id: projectId },
        relations: ['categories', 'project_manager', 'gallery']
      });
    } catch {
      throw new NotFoundException();
    }
  }

  async findOneWithParticipations(projectId: string): Promise<Project> {
    try {
      return await this.projectRepository.findOneOrFail({
        where: { id: projectId },
        relations: ['participations', 'participations.user']
      });
    } catch {
      throw new NotFoundException();
    }
  }

  async toggleHighlight(projectId: string): Promise<Project> {
    try {
      const project = await this.findOne(projectId);
      project.is_highlighted = !project.is_highlighted;
      return await this.projectRepository.save(project);
    } catch {
      throw new BadRequestException();
    }
  }

  async togglePublish(projectId: string): Promise<Project> {
    try {
      const project = await this.findOne(projectId);
      return await this.projectRepository.save({
        ...project,
        is_published: !project.is_published
      });
    } catch {
      throw new BadRequestException();
    }
  }

  async addCover(projectId: string, cover: string): Promise<Project> {
    try {
      const project = await this.findOne(projectId);
      return await this.projectRepository.save({
        ...project,
        cover
      });
    } catch {
      throw new BadRequestException();
    }
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    try {
      const project = await this.findOne(id);
      return await this.projectRepository.save({
        ...project,
        ...dto,
        project_manager: { id: dto?.project_manager ?? project.project_manager.id },
        program: { id: dto?.program ?? project.program.id },
        categories: dto.categories?.map((type) => ({ id: type })) || project.categories
      });
    } catch {
      throw new BadRequestException();
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const project = await this.findOne(id);
      await this.projectRepository.softDelete(project.id);
    } catch {
      throw new BadRequestException();
    }
  }
}
