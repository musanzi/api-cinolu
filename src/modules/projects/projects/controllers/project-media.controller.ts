import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { Project } from '../entities/project.entity';
import { ProjectMediaService } from '../services/project-media.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('projects')
export class ProjectMediaController {
  constructor(private readonly mediaService: ProjectMediaService) {}

  @Post('id/:projectId/gallery')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.mediaService.addImage(projectId, file);
  }

  @Delete('gallery/:galleryId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  removeImage(@Param('galleryId') galleryId: string): Promise<void> {
    return this.mediaService.removeImage(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.mediaService.findGallery(slug);
  }

  @Post('id/:projectId/cover')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/projects')))
  addCover(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File): Promise<Project> {
    return this.mediaService.addCover(projectId, file);
  }
}
