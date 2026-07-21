import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { Event } from '../entities/event.entity';
import { EventMediaService } from '../services/event-media.service';
import { Public, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('events')
export class EventMediaController {
  constructor(private readonly eventMediaService: EventMediaService) {}

  @Post('id/:eventId/gallery')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.eventMediaService.addImage(eventId, file);
  }

  @Delete('gallery/:galleryId')
  @HasRoles([Roles.STAFF])
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.eventMediaService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.eventMediaService.findGallery(slug);
  }

  @Post('id/:eventId/cover')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/events')))
  addCover(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File): Promise<Event> {
    return this.eventMediaService.addCover(eventId, file);
  }
}
