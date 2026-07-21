import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TagsService } from '../services/tags.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { FilterTagsInterface } from '../interfaces/filter-tags.interface';
import { Tag } from '../entities/tag.entity';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(dto);
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterTagsInterface): Promise<[Tag[], number]> {
    return this.tagsService.findFiltered(query);
  }

  @Get()
  @Public()
  findAll(): Promise<Tag[]> {
    return this.tagsService.findAll();
  }

  @Get('id/:id')
  findOne(@Param('id') id: string): Promise<Tag> {
    return this.tagsService.findOne(id);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateTagDto): Promise<Tag> {
    return this.tagsService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.tagsService.remove(id);
  }
}
