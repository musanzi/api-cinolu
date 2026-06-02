import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TagsService } from '../tags.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { FilterTagsDto } from '../dto/filter-tags.dto';
import { Tag } from '../entities/tag.entity';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(dto);
  }

  @Get('paginated')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: FilterTagsDto): Promise<[Tag[], number]> {
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateTagDto): Promise<Tag> {
    return this.tagsService.update(id, dto);
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.tagsService.remove(id);
  }
}
