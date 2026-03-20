import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Event } from '../entities/event.entity';
import { EventsService } from './events.service';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { GalleriesService } from '@/shared/galleries/galleries.service';

@Injectable()
export class EventMediaService {
  constructor(
    private readonly galleriesService: GalleriesService,
    private readonly eventsService: EventsService
  ) {}

  async addImage(eventId: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.eventsService.findOne(eventId);
      const galleryDto = { image: file.filename, event: { id: eventId } };
      await this.galleriesService.create(galleryDto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeGallery(galleryId: string): Promise<void> {
    try {
      await this.galleriesService.remove(galleryId);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('event', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }

  async addCover(eventId: string, file: Express.Multer.File): Promise<Event> {
    try {
      const event = await this.eventsService.findOne(eventId);
      if (event.cover) {
        await fs.unlink(`./uploads/events/${event.cover}`).catch(() => undefined);
      }
      return await this.eventsService.setCover(eventId, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }
}
