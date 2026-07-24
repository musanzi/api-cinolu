import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from '../entities/program.entity';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { FilterProgramsInterface } from '../interfaces/filter-programs.interface';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';

@Injectable()
export class ProgramsService extends AbstractRepository<Program> {
  constructor(
    @InjectRepository(Program)
    repository: Repository<Program>
  ) {
    super(repository);
  }

  async create(dto: CreateProgramDto): Promise<Program> {
    return await this.createEntity({ ...dto, category: { id: dto.category }, sector: { id: dto.sector } });
  }

  async findPublished(): Promise<Program[]> {
    return await this.findEntities({
      where: { is_published: true },
      order: { updated_at: 'DESC' },
      relations: ['category', 'sector', 'subprograms']
    });
  }

  async findAll(): Promise<Program[]> {
    return await this.findEntities({
      where: { is_published: true },
      order: { updated_at: 'DESC' },
      relations: ['category', 'sector']
    });
  }

  async findBySlug(slug: string): Promise<Program> {
    return await this.findEntity({ where: { slug }, relations: ['category', 'sector', 'subprograms'] });
  }

  async highlight(id: string): Promise<Program> {
    const program = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, { is_highlighted: !program.is_highlighted });
  }

  async togglePublish(id: string): Promise<Program> {
    const program = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, { is_published: !program.is_published });
  }

  async findFiltered(queryParams: FilterProgramsInterface): Promise<[Program[], number]> {
    const { page, q, filter = 'all' } = queryParams;
    const query = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.sector', 'sector')
      .orderBy('p.updated_at', 'DESC');
    if (filter === 'published') query.andWhere('p.is_published = :isPublished', { isPublished: true });
    if (filter === 'drafts') query.andWhere('p.is_published = :isPublished', { isPublished: false });
    if (filter === 'highlighted') query.andWhere('p.is_highlighted = :isHighlighted', { isHighlighted: true });
    if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 10 });
  }

  async setLogo(id: string, logo: string): Promise<Program> {
    return await this.updateEntity(id, { logo });
  }

  async findOne(id: string): Promise<Program> {
    return await this.findEntity({ where: { id }, relations: ['category', 'sector'] });
  }

  async update(id: string, dto: UpdateProgramDto): Promise<Program> {
    return await this.updateEntity(id, {
      ...dto,
      ...(dto.category && { category: { id: dto.category } }),
      ...(dto.sector && { sector: { id: dto.sector } })
    });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
