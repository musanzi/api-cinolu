import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProjectCategoriesService } from '../categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ProjectCategory as Category } from '../entities/category.entity';
import { FilterCategoriesInterface } from '../interfaces/filter-categories.interface';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('project-categories')
export class ProjectCategoriesController {
  constructor(private readonly projectCategoriesService: ProjectCategoriesService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.projectCategoriesService.create(dto);
  }

  @Get()
  @Public()
  findAll(): Promise<Category[]> {
    return this.projectCategoriesService.findAll();
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterCategoriesInterface): Promise<[Category[], number]> {
    return this.projectCategoriesService.findAllPaginated(query);
  }

  @Get('id/:id')
  @Public()
  findOne(@Param('id') id: string): Promise<Category> {
    return this.projectCategoriesService.findOne(id);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<Category> {
    return this.projectCategoriesService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.projectCategoriesService.remove(id);
  }
}
