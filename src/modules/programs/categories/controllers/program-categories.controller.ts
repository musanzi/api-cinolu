import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProgramCategoriesService } from '../categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ProgramCategory } from '../entities/category.entity';
import { QueryParams } from '../utils/query-params.type';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('program-categories')
export class ProgramCategoriesController {
  constructor(private readonly programCategoriesService: ProgramCategoriesService) {}

  @Get()
  @Public()
  findAll(): Promise<ProgramCategory[]> {
    return this.programCategoriesService.findAll();
  }

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateCategoryDto): Promise<ProgramCategory> {
    return this.programCategoriesService.create(dto);
  }

  @Get('paginated')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: QueryParams): Promise<[ProgramCategory[], number]> {
    return this.programCategoriesService.findPaginated(query);
  }

  @Get('id/:id')
  @Public()
  findOne(@Param('id') id: string): Promise<ProgramCategory> {
    return this.programCategoriesService.findOne(id);
  }

  @Patch('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<ProgramCategory> {
    return this.programCategoriesService.update(id, dto);
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.programCategoriesService.remove(id);
  }
}
