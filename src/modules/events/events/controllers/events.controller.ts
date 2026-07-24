import { Public } from '@/modules/auth/decorators/public.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';
import { FilterEventsInterface } from '../interfaces/filter-events.interface';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Event } from '../entities/event.entity';
import { EventsService } from '../services/events.service';
import { CurrentUser, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { User } from '@/modules/users/entities/user.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(dto);
  }

  @Get()
  @HasRoles([Roles.STAFF])
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
  @HasRoles([Roles.STAFF])
  togglePublish(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.togglePublish(eventId);
  }

  @Patch('id/:eventId/highlight')
  @HasRoles([Roles.STAFF])
  toggleHighlight(@Param('eventId') eventId: string): Promise<Event> {
    return this.eventsService.highlight(eventId);
  }

  @Patch('id/:eventId')
  @HasRoles([Roles.STAFF])
  update(@Param('eventId') eventId: string, @Body() dto: UpdateEventDto): Promise<Event> {
    return this.eventsService.update(eventId, dto);
  }

  @Delete('id/:eventId')
  @HasRoles([Roles.STAFF])
  remove(@Param('eventId') eventId: string): Promise<void> {
    return this.eventsService.remove(eventId);
  }

  @Post('id/:eventId/gallery')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.eventsService.addImage(eventId, file);
  }

  @Delete('gallery/:galleryId')
  @HasRoles([Roles.STAFF])
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.eventsService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.eventsService.findGallery(slug);
  }

  @Post('id/:eventId/cover')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/events')))
  addCover(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File): Promise<Event> {
    return this.eventsService.addCover(eventId, file);
  }

  @Post('id/:eventId/participate')
  participate(@Param('eventId') eventId: string, @CurrentUser() user: User): Promise<Event> {
    return this.eventsService.participate(eventId, user.id);
  }
}
