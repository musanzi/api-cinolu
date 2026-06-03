import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { Gallery } from '../entities/gallery.entity';
import { AddImageDto } from '../dto/add-image.dto';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class GalleriesService extends AbstractRepository<Gallery> {
  constructor(
    @InjectRepository(Gallery)
    repository: Repository<Gallery>
  ) {
    super(repository);
  }

  async create(dto: AddImageDto): Promise<Gallery> {
    return await this.createEntity(dto);
  }

  async findOne(id: string): Promise<Gallery> {
    return await this.findEntity({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    try {
      const gallery = await this.findOne(id);
      await this.removeImageFile(gallery.image);
      await this.hardDeleteEntity(id);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(repo: string, key: string): Promise<Gallery[]> {
    return this.findEntities({
      where: { [repo]: { slug: key } }
    });
  }

  async findVentureGallery(slug: string): Promise<Gallery[]> {
    return this.findEntities({
      where: { product: { slug } }
    });
  }

  private async removeImageFile(filename: string): Promise<void> {
    try {
      await fs.unlink(`./uploads/galleries/${filename}`);
    } catch {
      throw new BadRequestException('Suppression du fichier impossible');
    }
  }
}
