import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subprogram } from '../entities/subprogram.entity';
import { CreateSubprogramDto } from '../dto/create-subprogram.dto';
import { UpdateSubprogramDto } from '../dto/update-subprogram.dto';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { promises as fs } from 'fs';

@Injectable()
export class SubprogramsService extends AbstractRepository<Subprogram> {
  constructor(
    @InjectRepository(Subprogram)
    repository: Repository<Subprogram>
  ) {
    super(repository);
  }

  async create(dto: CreateSubprogramDto): Promise<Subprogram> {
    return await this.createEntity({ ...dto, program: { id: dto.programId } });
  }

  async findByProgram(programId: string): Promise<Subprogram[]> {
    return await this.findEntities({
      relations: ['program'],
      where: { program: { id: programId } },
      order: { updated_at: 'DESC' }
    });
  }

  async findAll(): Promise<Subprogram[]> {
    return await this.findEntities({
      relations: ['program'],
      order: { updated_at: 'DESC' }
    });
  }

  async findBySlug(slug: string): Promise<Subprogram> {
    return await this.findEntity({ where: { slug }, relations: ['projects', 'events'] });
  }

  async highlight(id: string): Promise<Subprogram> {
    const subprogram = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, { is_highlighted: !subprogram.is_highlighted });
  }

  async togglePublish(id: string): Promise<Subprogram> {
    const subprogram = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, { is_published: !subprogram.is_published });
  }

  async setLogo(id: string, logo: string): Promise<Subprogram> {
    return await this.updateEntity(id, { logo });
  }

  async findOne(id: string): Promise<Subprogram> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: UpdateSubprogramDto): Promise<Subprogram> {
    return await this.updateEntity(id, { ...dto, ...(dto.programId && { program: { id: dto.programId } }) });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async addLogo(id: string, file: Express.Multer.File): Promise<Subprogram> {
    try {
      const subprogram = await this.findOne(id);
      if (subprogram.logo) {
        await fs.unlink(`./uploads/subprograms/${subprogram.logo}`).catch(() => undefined);
      }
      return await this.setLogo(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }
}
