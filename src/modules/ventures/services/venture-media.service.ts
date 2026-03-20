import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Venture } from '../entities/venture.entity';
import { VenturesService } from './ventures.service';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { GalleriesService } from '@/shared/galleries/galleries.service';

@Injectable()
export class VentureMediaService {
  constructor(
    private readonly galleriesService: GalleriesService,
    private readonly venturesService: VenturesService
  ) {}

  async addImage(ventureId: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.venturesService.findOne(ventureId);
      const galleryDto = {
        image: file.filename,
        venture: { id: ventureId }
      };
      await this.galleriesService.create(galleryDto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeImage(galleryId: string): Promise<void> {
    try {
      await this.galleriesService.remove(galleryId);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('venture', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }

  async addLogo(ventureId: string, file: Express.Multer.File): Promise<Venture> {
    try {
      const venture = await this.venturesService.findOne(ventureId);
      if (venture.logo) {
        await fs.unlink(`./uploads/ventures/logos/${venture.logo}`).catch(() => undefined);
      }
      return await this.venturesService.setLogo(ventureId, file.filename);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }

  async addCover(ventureId: string, file: Express.Multer.File): Promise<Venture> {
    try {
      const venture = await this.venturesService.findOne(ventureId);
      if (venture.cover) {
        await fs.unlink(`./uploads/ventures/covers/${venture.cover}`).catch(() => undefined);
      }
      return await this.venturesService.setCover(ventureId, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }
}
