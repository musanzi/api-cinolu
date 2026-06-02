import { Injectable } from '@nestjs/common';
import { CreateExpertiseDto } from './dto/create-expertise.dto';
import { UpdateExpertiseDto } from './dto/update-expertise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expertise } from './entities/expertise.entity';
import { FilterExpertisesInterface } from './interfaces/filter-expertises.interface';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class ExpertisesService extends AbstractRepository<Expertise> {
  constructor(
    @InjectRepository(Expertise)
    repository: Repository<Expertise>
  ) {
    super(repository);
  }

  async create(dto: CreateExpertiseDto): Promise<Expertise> {
    return await this.createEntity(dto);
  }

  async findFiltered(dto: FilterExpertisesInterface): Promise<[Expertise[], number]> {
    const { q, page } = dto;
    const query = this.repository.createQueryBuilder('e');
    if (q) query.andWhere('e.name LIKE :search', { search: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findAll(): Promise<Expertise[]> {
    return await this.findEntities();
  }

  async findOne(id: string): Promise<Expertise> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: UpdateExpertiseDto): Promise<Expertise> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
