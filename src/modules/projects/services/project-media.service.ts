import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Project } from '../entities/project.entity';
import { ProjectsService } from './projects.service';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { GalleriesService } from '@/shared/galleries/galleries.service';

@Injectable()
export class ProjectMediaService {
  constructor(
    private readonly galleriesService: GalleriesService,
    private readonly projectsService: ProjectsService
  ) {}

  async addImage(projectId: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.projectsService.findOne(projectId);
      const galleryDto = {
        image: file.filename,
        project: { id: projectId }
      };
      await this.galleriesService.create(galleryDto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeImage(id: string): Promise<void> {
    try {
      await this.galleriesService.remove(id);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('project', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }

  async addCover(projectId: string, file: Express.Multer.File): Promise<Project> {
    try {
      const project = await this.projectsService.findOne(projectId);
      if (project.cover) {
        await fs.unlink(`./uploads/projects/${project.cover}`).catch(() => undefined);
      }
      return await this.projectsService.addCover(projectId, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }
}
