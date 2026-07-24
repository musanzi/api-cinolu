import { Injectable } from '@nestjs/common';
import { EventCategory } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { FilterCategoriesInterface } from './interfaces/filter-categories.interface';

@Injectable()
export class EventCategoriesService extends AbstractRepository<EventCategory> {
  constructor(@InjectRepository(EventCategory) categoryRepository: Repository<EventCategory>) {
    super(categoryRepository);
  }

  async create(dto: { name: string }): Promise<EventCategory> {
    return await this.createEntity(dto);
  }

  async findAll(): Promise<EventCategory[]> {
    return await this.findEntities();
  }

  async findAllPaginated(queryParams: FilterCategoriesInterface): Promise<[EventCategory[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.repository.createQueryBuilder('c').orderBy('c.updated_at', 'DESC');
    if (q) query.where('c.name LIKE :q', { q: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findOne(id: string): Promise<EventCategory> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: { name?: string }): Promise<EventCategory> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
