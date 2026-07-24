import { Injectable } from '@nestjs/common';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../entities/tag.entity';
import { Repository } from 'typeorm';
import { FilterTagsInterface } from '../interfaces/filter-tags.interface';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';

@Injectable()
export class TagsService extends AbstractRepository<Tag> {
  constructor(
    @InjectRepository(Tag)
    repository: Repository<Tag>
  ) {
    super(repository);
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    return await this.createEntity(dto);
  }

  async findAll(): Promise<Tag[]> {
    return await this.findEntities();
  }

  async findFiltered(dto: FilterTagsInterface): Promise<[Tag[], number]> {
    const { q, page } = dto;
    const query = this.repository.createQueryBuilder('t');
    if (q) query.andWhere('t.name LIKE :search', { search: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async findOne(id: string): Promise<Tag> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.hardDeleteEntity(id);
  }
}
