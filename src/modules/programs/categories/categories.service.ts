import { Injectable } from '@nestjs/common';
import { ProgramCategory } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '@/modules/database/abstract.repository';
import { FilterCategoriesInterface } from './interfaces/filter-categories.interface';

@Injectable()
export class ProgramCategoriesService extends AbstractRepository<ProgramCategory> {
  constructor(@InjectRepository(ProgramCategory) categoryRepository: Repository<ProgramCategory>) {
    super(categoryRepository);
  }

  async create(dto: { name: string }): Promise<ProgramCategory> {
    return await this.createEntity(dto);
  }

  async findAll(): Promise<ProgramCategory[]> {
    return await this.findEntities();
  }

  async findPaginated(queryParams: FilterCategoriesInterface): Promise<[ProgramCategory[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.repository.createQueryBuilder('c').orderBy('c.updated_at', 'DESC');
    if (q) query.where('c.name LIKE :q', { q: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findOne(id: string): Promise<ProgramCategory> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: { name?: string }): Promise<ProgramCategory> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
