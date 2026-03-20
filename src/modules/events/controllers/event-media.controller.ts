import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { Event } from '../entities/event.entity';
import { EventMediaService } from '../services/event-media.service';

@Controller('events')
export class EventMediaController {
  constructor(private readonly eventMediaService: EventMediaService) {}

  @Post('id/:eventId/gallery')
  @Rbac({ resource: 'events', action: 'update' })
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.eventMediaService.addImage(eventId, file);
  }

  @Delete('gallery/:galleryId')
  @Rbac({ resource: 'events', action: 'update' })
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.eventMediaService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.eventMediaService.findGallery(slug);
  }

  @Post('id/:eventId/cover')
  @Rbac({ resource: 'events', action: 'update' })
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/events')))
  addCover(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File): Promise<Event> {
    return this.eventMediaService.addCover(eventId, file);
  }
}
