import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { CreateEventDto } from '../dto/create-event.dto';
import { FilterEventsDto } from '../dto/filter-events.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Event } from '../entities/event.entity';
import { EventsService } from '../services/events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Rbac({ resource: 'events', action: 'create' })
  create(@Body() dto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(dto);
  }

  @Get()
  @Rbac({ resource: 'events', action: 'read' })
  findAll(@Query() query: FilterEventsDto): Promise<[Event[], number]> {
    return this.eventsService.findAll(query);
  }

  @Get('recent')
  @Public()
  findRecent(): Promise<Event[]> {
    return this.eventsService.findRecent();
  }

  @Get('published')
  @Public()
  findPublished(@Query() query: FilterEventsDto): Promise<[Event[], number]> {
    return this.eventsService.findPublished(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Event> {
    return this.eventsService.findBySlug(slug);
  }

  @Get('id/:eventId')
  @Rbac({ resource: 'events', action: 'read' })
  findOne(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.findOne(eventId);
  }

  @Patch('id/:eventId/publish')
  @Rbac({ resource: 'events', action: 'update' })
  togglePublish(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.togglePublish(eventId);
  }

  @Patch('id/:eventId/highlight')
  @Rbac({ resource: 'events', action: 'update' })
  toggleHighlight(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.highlight(eventId);
  }

  @Patch('id/:eventId')
  @Rbac({ resource: 'events', action: 'update' })
  update(@Param('eventId') eventId: string, @Body() dto: UpdateEventDto): Promise<Event> {
    return this.eventsService.update(eventId, dto);
  }

  @Delete('id/:eventId')
  @Rbac({ resource: 'events', action: 'delete' })
  remove(@Param('eventId') eventId: string): Promise<void> {
    return this.eventsService.remove(eventId);
  }
}
