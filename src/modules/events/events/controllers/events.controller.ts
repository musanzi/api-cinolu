import { Public } from '@/modules/auth/decorators/public.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';
import { FilterEventsInterface } from '../interfaces/filter-events.interface';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Event } from '../entities/event.entity';
import { EventsService } from '../services/events.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(dto);
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findAll(@Query() query: FilterEventsInterface): Promise<[Event[], number]> {
    return this.eventsService.findAll(query);
  }

  @Get('recent')
  @Public()
  findRecent(): Promise<Event[]> {
    return this.eventsService.findRecent();
  }

  @Get('published')
  @Public()
  findPublished(@Query() query: FilterEventsInterface): Promise<[Event[], number]> {
    return this.eventsService.findPublished(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Event> {
    return this.eventsService.findBySlug(slug);
  }

  @Get('id/:eventId')
  @Public()
  findOne(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.findOne(eventId);
  }

  @Patch('id/:eventId/publish')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  togglePublish(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.togglePublish(eventId);
  }

  @Patch('id/:eventId/highlight')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  toggleHighlight(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.highlight(eventId);
  }

  @Patch('id/:eventId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('eventId') eventId: string, @Body() dto: UpdateEventDto): Promise<Event> {
    return this.eventsService.update(eventId, dto);
  }

  @Delete('id/:eventId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('eventId') eventId: string): Promise<void> {
    return this.eventsService.remove(eventId);
  }
}
