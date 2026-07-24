import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { FilterOpportunitiesInterface } from '../interfaces/filter-opportunities.interface';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { Opportunity } from '../entities/opportunity.entity';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { promises as fs } from 'fs';

@Injectable()
export class OpportunitiesService extends AbstractRepository<Opportunity> {
  constructor(
    @InjectRepository(Opportunity)
    repository: Repository<Opportunity>
  ) {
    super(repository);
  }

  async create(dto: CreateOpportunityDto): Promise<Opportunity> {
    return await this.createEntity(dto);
  }

  async findAll(filters: FilterOpportunitiesInterface): Promise<Opportunity[]> {
    return await this.findEntities({ where: this.buildWhere(filters), order: { due_date: 'ASC' } });
  }

  async findOne(slug: string): Promise<Opportunity> {
    return await this.findEntity({ where: { slug } });
  }

  async findOneById(id: string): Promise<Opportunity> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.hardDeleteEntity(id);
  }

  async addCover(id: string, cover: string): Promise<Opportunity> {
    const opportunity = await this.findOneById(id);
    if (opportunity.cover) {
      await fs.unlink(`./uploads/opportunities/${opportunity.cover}`).catch(() => undefined);
    }
    return await this.updateEntity(id, { cover });
  }

  private buildWhere(filters: FilterOpportunitiesInterface): FindOptionsWhere<Opportunity> {
    const where: FindOptionsWhere<Opportunity> = {};
    if (filters.language) where.language = filters.language.toLowerCase() as Opportunity['language'];
    if (filters.from && filters.to) where.due_date = Between(filters.from, filters.to) as never;
    if (filters.from && !filters.to) where.due_date = MoreThanOrEqual(filters.from) as never;
    if (!filters.from && filters.to) where.due_date = LessThanOrEqual(filters.to) as never;
    return where;
  }
}
