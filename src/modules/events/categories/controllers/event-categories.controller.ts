import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EventCategoriesService } from '../categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { EventCategory } from '../entities/category.entity';
import { FilterCategoriesInterface } from '../interfaces/filter-categories.interface';
import { Public, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('event-categories')
export class EventCategoriesController {
  constructor(private readonly eventCategoriesService: EventCategoriesService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateCategoryDto): Promise<EventCategory> {
    return this.eventCategoriesService.create(dto);
  }

  @Get()
  @Public()
  findAll(): Promise<EventCategory[]> {
    return this.eventCategoriesService.findAll();
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterCategoriesInterface): Promise<[EventCategory[], number]> {
    return this.eventCategoriesService.findAllPaginated(query);
  }

  @Get('id/:id')
  findOne(@Param('id') id: string): Promise<EventCategory> {
    return this.eventCategoriesService.findOne(id);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<EventCategory> {
    return this.eventCategoriesService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.eventCategoriesService.remove(id);
  }
}
