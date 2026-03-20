import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpertiseDto } from './dto/create-expertise.dto';
import { UpdateExpertiseDto } from './dto/update-expertise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expertise } from './entities/expertise.entity';
import { FilterExpertisesDto } from './dto/filter-expertises.dto';

@Injectable()
export class ExpertisesService {
  constructor(
    @InjectRepository(Expertise)
    private expertiseRepository: Repository<Expertise>
  ) {}

  async create(dto: CreateExpertiseDto): Promise<Expertise> {
    try {
      return await this.expertiseRepository.save(dto);
    } catch {
      throw new BadRequestException("Création de l'expertise impossible");
    }
  }

  async findFiltered(dto: FilterExpertisesDto): Promise<[Expertise[], number]> {
    const { q, page } = dto;
    const query = this.expertiseRepository.createQueryBuilder('e');
    if (q) query.andWhere('e.name LIKE :search', { search: `%${q}%` });
    if (page) query.skip((+page - 1) * 10).take(10);
    return await query.getManyAndCount();
  }

  async findAll(): Promise<Expertise[]> {
    return await this.expertiseRepository.find();
  }

  async findOne(id: string): Promise<Expertise> {
    try {
      return await this.expertiseRepository.findOneOrFail({ where: { id } });
    } catch {
      throw new NotFoundException('Expertise introuvable');
    }
  }

  async update(id: string, dto: UpdateExpertiseDto): Promise<Expertise> {
    try {
      await this.expertiseRepository.update(id, dto);
      return await this.findOne(id);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.expertiseRepository.softDelete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
