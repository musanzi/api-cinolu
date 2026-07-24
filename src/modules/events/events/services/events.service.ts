import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { FilterEventsInterface } from '../interfaces/filter-events.interface';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { EventParticipation } from '../entities/event-participation.entity';
import { promises as fs } from 'fs';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { GalleriesService } from '../../../galleries/services/galleries.service';

@Injectable()
export class EventsService extends AbstractRepository<Event> {
  constructor(
    @InjectRepository(Event)
    repository: Repository<Event>,
    @InjectRepository(EventParticipation)
    private readonly participationRepository: Repository<EventParticipation>,
    private readonly galleriesService: GalleriesService
  ) {
    super(repository);
  }

  async create(dto: CreateEventDto): Promise<Event> {
    return await this.createEntity({
      ...dto,
      event_manager: { id: dto.event_manager },
      program: { id: dto.program },
      categories: dto.categories.map((id) => ({ id }))
    });
  }

  async findAll(queryParams: FilterEventsInterface): Promise<[Event[], number]> {
    const { page = 1, q, categories, filter = 'all' } = queryParams;
    const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
    const query = this.repository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.categories', 'categories')
      .orderBy('e.ended_at', 'DESC')
      .addOrderBy('e.id', 'DESC');
    if (filter === 'published') query.andWhere('e.is_published = :isPublished', { isPublished: true });
    if (filter === 'drafts') query.andWhere('e.is_published = :isPublished', { isPublished: false });
    if (filter === 'highlighted') query.andWhere('e.is_highlighted = :isHighlighted', { isHighlighted: true });
    if (q) query.andWhere('(e.name LIKE :q OR e.description LIKE :q)', { q: `%${q}%` });
    if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
    return await this.findPaginatedEntities(query, { page, take: 20 });
  }

  async findPublished(queryParams: FilterEventsInterface): Promise<[Event[], number]> {
    const { page = 1, q, categories } = queryParams;
    const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
    const query = this.repository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.categories', 'categories')
      .andWhere('e.is_published = :is_published', { is_published: true });
    if (q) query.andWhere('(e.name LIKE :q OR e.description LIKE :q)', { q: `%${q}%` });
    if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
    query.orderBy('e.started_at', 'DESC').addOrderBy('e.id', 'DESC');
    return await this.findPaginatedEntities(query, { page, take: 40 });
  }

  async highlight(id: string): Promise<Event> {
    const event = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, { is_highlighted: !event.is_highlighted });
  }

  async togglePublish(id: string): Promise<Event> {
    const event = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, { is_published: !event.is_published });
  }

  async setCover(id: string, cover: string): Promise<Event> {
    return await this.updateEntity(id, { cover });
  }

  async findRecent(): Promise<Event[]> {
    return await this.findEntities({
      order: { ended_at: 'DESC' },
      relations: ['categories'],
      where: { is_published: true },
      take: 6
    });
  }

  async findBySlug(slug: string): Promise<Event> {
    return await this.findEntity({
      where: { slug },
      relations: ['categories', 'event_manager', 'program.program', 'gallery', 'participations', 'participations.user']
    });
  }

  async findOne(id: string): Promise<Event> {
    return await this.findEntity({
      where: { id },
      relations: ['categories', 'event_manager', 'program', 'gallery', 'participations', 'participations.user']
    });
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    return await this.updateEntity(id, {
      ...dto,
      event_manager: { id: dto.event_manager },
      program: { id: dto.program },
      categories: dto.categories && dto.categories.map((type) => ({ id: type }))
    });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async addImage(eventId: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.findOne(eventId);
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
      const event = await this.findOne(eventId);
      if (event.cover) {
        await fs.unlink(`./uploads/events/${event.cover}`).catch(() => undefined);
      }
      return await this.setCover(eventId, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }

  async participate(eventId: string, userId: string): Promise<Event> {
    const existing = await this.participationRepository.findOne({
      where: { event: { id: eventId }, user: { id: userId } }
    });
    if (existing) {
      throw new BadRequestException('Participation déjà enregistrée');
    }
    await this.findOne(eventId);
    await this.participationRepository.save({
      user: { id: userId },
      event: { id: eventId }
    });
    return this.findOne(eventId);
  }
}
