import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { Project } from '../entities/project.entity';
import { ProjectMediaService } from '../services/project-media.service';

@Controller('projects')
export class ProjectMediaController {
  constructor(private readonly mediaService: ProjectMediaService) {}

  @Post('id/:projectId/gallery')
  @Rbac({ resource: 'projects', action: 'update' })
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.mediaService.addImage(projectId, file);
  }

  @Delete('gallery/:galleryId')
  @Rbac({ resource: 'projects', action: 'update' })
  removeImage(@Param('galleryId') galleryId: string): Promise<void> {
    return this.mediaService.removeImage(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.mediaService.findGallery(slug);
  }

  @Post('id/:projectId/cover')
  @Rbac({ resource: 'projects', action: 'update' })
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/projects')))
  addCover(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File): Promise<Project> {
    return this.mediaService.addCover(projectId, file);
  }
}
