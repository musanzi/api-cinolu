import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { Gallery } from './entities/gallery.entity';
import { AddImageDto } from './dto/add-image.dto';

@Injectable()
export class GalleriesService {
  constructor(
    @InjectRepository(Gallery)
    private readonly galleryRepository: Repository<Gallery>
  ) {}

  async create(dto: AddImageDto): Promise<Gallery> {
    try {
      return await this.galleryRepository.save(dto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async findOne(id: string): Promise<Gallery> {
    try {
      return await this.galleryRepository.findOneOrFail({
        where: { id }
      });
    } catch {
      throw new NotFoundException('Image introuvable');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const gallery = await this.findOne(id);
      await this.removeImageFile(gallery.image);
      await this.galleryRepository.delete(id);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(repo: string, key: string): Promise<Gallery[]> {
    return this.galleryRepository.find({
      where: { [repo]: { slug: key } }
    });
  }

  async findVentureGallery(slug: string): Promise<Gallery[]> {
    return this.galleryRepository.find({
      where: { product: { slug } }
    });
  }

  private async removeImageFile(filename: string): Promise<void> {
    try {
      await fs.unlink(`./uploads/galleries/${filename}`);
    } catch {
      throw new BadRequestException("Suppression du fichier impossible");
    }
  }
}
