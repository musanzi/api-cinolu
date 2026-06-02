import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { Venture } from '../entities/venture.entity';
import { VentureMediaService } from '../services/venture-media.service';

@Controller('ventures')
export class VentureMediaController {
  constructor(private readonly ventureMediaService: VentureMediaService) {}

  @Post('id/:ventureId/gallery')
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('ventureId') ventureId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.ventureMediaService.addImage(ventureId, file);
  }

  @Delete('gallery/:galleryId')
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.ventureMediaService.removeImage(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.ventureMediaService.findGallery(slug);
  }

  @Post('id/:ventureId/logo')
  @UseInterceptors(FileInterceptor('logo', createDiskUploadOptions('./uploads/ventures/logos')))
  addLogo(@Param('ventureId') ventureId: string, @UploadedFile() file: Express.Multer.File): Promise<Venture> {
    return this.ventureMediaService.addLogo(ventureId, file);
  }

  @Post('id/:ventureId/cover')
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/ventures/covers')))
  addCover(@Param('ventureId') ventureId: string, @UploadedFile() file: Express.Multer.File): Promise<Venture> {
    return this.ventureMediaService.addCover(ventureId, file);
  }
}
