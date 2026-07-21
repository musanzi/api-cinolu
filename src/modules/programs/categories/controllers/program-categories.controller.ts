import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProgramCategoriesService } from '../categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ProgramCategory } from '../entities/category.entity';
import { FilterCategoriesInterface } from '../interfaces/filter-categories.interface';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('program-categories')
export class ProgramCategoriesController {
  constructor(private readonly programCategoriesService: ProgramCategoriesService) {}

  @Get()
  @Public()
  findAll(): Promise<ProgramCategory[]> {
    return this.programCategoriesService.findAll();
  }

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateCategoryDto): Promise<ProgramCategory> {
    return this.programCategoriesService.create(dto);
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterCategoriesInterface): Promise<[ProgramCategory[], number]> {
    return this.programCategoriesService.findPaginated(query);
  }

  @Get('id/:id')
  @Public()
  findOne(@Param('id') id: string): Promise<ProgramCategory> {
    return this.programCategoriesService.findOne(id);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<ProgramCategory> {
    return this.programCategoriesService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.programCategoriesService.remove(id);
  }
}
