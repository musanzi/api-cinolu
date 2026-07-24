import { Injectable } from '@nestjs/common';
import { ProjectCategory } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { FilterCategoriesInterface } from './interfaces/filter-categories.interface';

@Injectable()
export class ProjectCategoriesService extends AbstractRepository<ProjectCategory> {
  constructor(@InjectRepository(ProjectCategory) categoryRepository: Repository<ProjectCategory>) {
    super(categoryRepository);
  }

  async create(dto: { name: string }): Promise<ProjectCategory> {
    return await this.createEntity(dto);
  }

  async findAll(): Promise<ProjectCategory[]> {
    return await this.findEntities();
  }

  async findAllPaginated(queryParams: FilterCategoriesInterface): Promise<[ProjectCategory[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.repository.createQueryBuilder('c').orderBy('c.updated_at', 'DESC');
    if (q) query.where('c.name LIKE :q', { q: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findOne(id: string): Promise<ProjectCategory> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: { name?: string }): Promise<ProjectCategory> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
