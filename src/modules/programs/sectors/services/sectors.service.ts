import { Injectable } from '@nestjs/common';
import { ProgramSector } from '../entities/sector.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { FilterSectorsInterface } from '../interfaces/filter-sectors.interface';

@Injectable()
export class ProgramSectorsService extends AbstractRepository<ProgramSector> {
  constructor(@InjectRepository(ProgramSector) sectorRepository: Repository<ProgramSector>) {
    super(sectorRepository);
  }

  async create(dto: { name: string }): Promise<ProgramSector> {
    return await this.createEntity(dto);
  }

  async findAll(): Promise<ProgramSector[]> {
    return await this.findEntities();
  }

  async findPaginated(queryParams: FilterSectorsInterface): Promise<[ProgramSector[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.repository.createQueryBuilder('c').orderBy('c.updated_at', 'DESC');
    if (q) query.where('c.name LIKE :q', { q: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findOne(id: string): Promise<ProgramSector> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: { name?: string }): Promise<ProgramSector> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
