import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { FilterEventsDto } from '../dto/filter-events.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    try {
      const event = this.eventRepository.create({
        ...dto,
        event_manager: { id: dto.event_manager },
        program: { id: dto.program },
        categories: dto.categories.map((id) => ({ id }))
      });
      return await this.eventRepository.save(event);
    } catch {
      throw new BadRequestException("Création de l'événement impossible");
    }
  }

  async findAll(queryParams: FilterEventsDto): Promise<[Event[], number]> {
    const { page = 1, q, categories, filter = 'all' } = queryParams;
    const query = this.eventRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.categories', 'categories')
      .orderBy('e.ended_at', 'DESC');
    if (filter === 'published') query.andWhere('e.is_published = :isPublished', { isPublished: true });
    if (filter === 'drafts') query.andWhere('e.is_published = :isPublished', { isPublished: false });
    if (filter === 'highlighted') query.andWhere('e.is_highlighted = :isHighlighted', { isHighlighted: true });
    if (q) query.andWhere('(e.name LIKE :q OR e.description LIKE :q)', { q: `%${q}%` });
    if (categories?.length) query.andWhere('categories.id IN (:...categories)', { categories });
    return await query
      .skip((+page - 1) * 20)
      .take(20)
      .getManyAndCount();
  }

  async findPublished(queryParams: FilterEventsDto): Promise<[Event[], number]> {
    const { page = 1, q, categories } = queryParams;
    const skip = (+page - 1) * 40;
    const query = this.eventRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.categories', 'categories')
      .andWhere('e.is_published = :is_published', { is_published: true });
    if (q) query.andWhere('(e.name LIKE :q OR e.description LIKE :q)', { q: `%${q}%` });
    if (categories?.length) query.andWhere('categories.id IN (:...categories)', { categories });
    return await query.skip(skip).take(40).orderBy('e.started_at', 'DESC').getManyAndCount();
  }

  async highlight(id: string): Promise<Event> {
    try {
      const event = await this.findOne(id);
      event.is_highlighted = !event.is_highlighted;
      return await this.eventRepository.save(event);
    } catch {
      throw new BadRequestException('Mise en avant impossible');
    }
  }

  async togglePublish(id: string): Promise<Event> {
    try {
      const event = await this.findOne(id);
      event.is_published = !event.is_published;
      return await this.eventRepository.save(event);
    } catch {
      throw new BadRequestException('Publication impossible');
    }
  }

  async setCover(id: string, cover: string): Promise<Event> {
    try {
      const event = await this.findOne(id);
      return await this.eventRepository.save({
        ...event,
        cover
      });
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }

  async findRecent(): Promise<Event[]> {
    try {
      return await this.eventRepository.find({
        order: { ended_at: 'DESC' },
        relations: ['categories'],
        where: { is_published: true },
        take: 6
      });
    } catch {
      throw new BadRequestException('Événements introuvables');
    }
  }

  async findBySlug(slug: string): Promise<Event> {
    try {
      return await this.eventRepository.findOneOrFail({
        where: { slug },
        relations: [
          'categories',
          'event_manager',
          'program.program',
          'gallery',
          'participations',
          'participations.user'
        ]
      });
    } catch {
      throw new NotFoundException('Événement introuvable');
    }
  }

  async findOne(id: string): Promise<Event> {
    try {
      return await this.eventRepository.findOneOrFail({
        where: { id },
        relations: ['categories', 'event_manager', 'program', 'gallery', 'participations', 'participations.user']
      });
    } catch {
      throw new NotFoundException('Événement introuvable');
    }
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    try {
      const event = await this.findOne(id);
      return await this.eventRepository.save({
        ...event,
        ...dto,
        event_manager: dto.event_manager ? { id: dto.event_manager } : event.event_manager,
        program: dto.program ? { id: dto.program } : event.program,
        categories: dto.categories?.map((type) => ({ id: type })) || event.categories
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const event = await this.findOne(id);
      await this.eventRepository.softDelete(event.id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
