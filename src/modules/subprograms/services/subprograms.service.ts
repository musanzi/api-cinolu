import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subprogram } from '../entities/subprogram.entity';
import { CreateSubprogramDto } from '../dto/create-subprogram.dto';
import { UpdateSubprogramDto } from '../dto/update-subprogram.dto';

@Injectable()
export class SubprogramsService {
  constructor(
    @InjectRepository(Subprogram)
    private readonly subprogramRepository: Repository<Subprogram>
  ) {}

  async create(dto: CreateSubprogramDto): Promise<Subprogram> {
    try {
      const subprogram = this.subprogramRepository.create({
        ...dto,
        program: { id: dto.programId }
      });
      return await this.subprogramRepository.save(subprogram);
    } catch {
      throw new BadRequestException('Création du sous-programme impossible');
    }
  }

  async findByProgram(programId: string): Promise<Subprogram[]> {
    try {
      return await this.subprogramRepository.find({
        relations: ['program'],
        where: { program: { id: programId } },
        order: { updated_at: 'DESC' }
      });
    } catch {
      throw new NotFoundException('Sous-programmes introuvables');
    }
  }

  async findAll(): Promise<Subprogram[]> {
    return await this.subprogramRepository.find({
      relations: ['program'],
      order: { updated_at: 'DESC' }
    });
  }

  async findBySlug(slug: string): Promise<Subprogram> {
    try {
      return await this.subprogramRepository.findOneOrFail({
        where: { slug },
        relations: ['projects', 'events']
      });
    } catch {
      throw new NotFoundException('Sous-programme introuvable');
    }
  }

  async highlight(id: string): Promise<Subprogram> {
    try {
      const subprogram = await this.findOne(id);
      subprogram.is_highlighted = !subprogram.is_highlighted;
      return await this.subprogramRepository.save(subprogram);
    } catch {
      throw new BadRequestException('Mise en avant impossible');
    }
  }

  async togglePublish(id: string): Promise<Subprogram> {
    try {
      const subprogram = await this.findOne(id);
      subprogram.is_published = !subprogram.is_published;
      return await this.subprogramRepository.save(subprogram);
    } catch {
      throw new BadRequestException('Publication impossible');
    }
  }

  async setLogo(id: string, logo: string): Promise<Subprogram> {
    try {
      const subprogram = await this.findOne(id);
      subprogram.logo = logo;
      return await this.subprogramRepository.save(subprogram);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }

  async findOne(id: string): Promise<Subprogram> {
    try {
      return await this.subprogramRepository.findOneOrFail({
        where: { id }
      });
    } catch {
      throw new NotFoundException('Sous-programme introuvable');
    }
  }

  async update(id: string, dto: UpdateSubprogramDto): Promise<Subprogram> {
    try {
      const subprogram = await this.findOne(id);
      return await this.subprogramRepository.save({
        ...subprogram,
        ...dto,
        program: dto.programId ? { id: dto.programId } : subprogram.program
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const subprogram = await this.findOne(id);
      await this.subprogramRepository.softDelete(subprogram.id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
