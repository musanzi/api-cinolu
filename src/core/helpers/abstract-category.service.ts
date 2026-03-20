import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AbstractEntity } from '@/core/helpers/abstract.entity';
import { PaginationQuery } from '@/core/types/pagination.query';

type NameDto = { name: string };

export abstract class BaseCategoryService<T extends AbstractEntity & { name: string }> {
  protected constructor(protected readonly categoryRepository: Repository<T>) {}

  async create(dto: NameDto): Promise<T> {
    try {
      return await this.categoryRepository.save(dto as T);
    } catch {
      throw new BadRequestException('Création impossible');
    }
  }

  async findAll(): Promise<T[]> {
    return this.categoryRepository.find();
  }

  async findPaginated(queryParams: PaginationQuery): Promise<[T[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.categoryRepository.createQueryBuilder('c').orderBy('c.updated_at', 'DESC');
    if (q) query.where('c.name LIKE :q', { q: `%${q}%` });
    return query
      .skip((+page - 1) * 10)
      .take(10)
      .getManyAndCount();
  }

  async findOne(id: string): Promise<T> {
    try {
      return await this.categoryRepository.createQueryBuilder('c').where('c.id = :id', { id }).getOneOrFail();
    } catch {
      throw new NotFoundException('Catégorie introuvable');
    }
  }

  async update(id: string, dto: Partial<NameDto>): Promise<T> {
    try {
      const category = await this.findOne(id);
      return await this.categoryRepository.save({ ...category, ...dto });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.categoryRepository.softDelete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
