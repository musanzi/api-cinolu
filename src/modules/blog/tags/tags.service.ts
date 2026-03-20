import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { FilterTagsDto } from './dto/filter-tags.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  async create(dto: CreateTagDto): Promise<Tag> {
    try {
      const tag = this.tagRepository.create(dto);
      return await this.tagRepository.save(tag);
    } catch {
      throw new BadRequestException('Création du tag impossible');
    }
  }

  async findAll(): Promise<Tag[]> {
    return await this.tagRepository.find();
  }

  async findFiltered(dto: FilterTagsDto): Promise<[Tag[], number]> {
    const { q, page } = dto;
    const query = this.tagRepository.createQueryBuilder('t');
    if (q) query.andWhere('t.name LIKE :search', { search: `%${q}%` });
    if (page) query.skip((+page - 1) * 10).take(10);
    return await query.getManyAndCount();
  }

  async findOne(id: string): Promise<Tag> {
    try {
      return await this.tagRepository.findOne({
        where: { id }
      });
    } catch {
      throw new NotFoundException('Tag introuvable');
    }
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    try {
      await this.tagRepository.update(id, dto);
      return await this.tagRepository.findOne({ where: { id } });
    } catch {
      throw new NotFoundException('Tag introuvable');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.tagRepository.delete(id);
    } catch {
      throw new NotFoundException('Tag introuvable');
    }
  }
}
