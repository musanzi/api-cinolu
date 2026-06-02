import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExpertisesService } from '../expertises.service';
import { CreateExpertiseDto } from '../dto/create-expertise.dto';
import { UpdateExpertiseDto } from '../dto/update-expertise.dto';
import { Expertise } from '../entities/expertise.entity';
import { FilterExpertisesDto } from '../dto/filter-expertises.dto';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('expertises')
export class ExpertisesController {
  constructor(private readonly expertisesService: ExpertisesService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateExpertiseDto): Promise<Expertise> {
    return this.expertisesService.create(dto);
  }

  @Get('paginated')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: FilterExpertisesDto): Promise<[Expertise[], number]> {
    return this.expertisesService.findFiltered(query);
  }

  @Get()
  findAll(): Promise<Expertise[]> {
    return this.expertisesService.findAll();
  }

  @Get('id/:id')
  findOne(@Param('id') id: string): Promise<Expertise> {
    return this.expertisesService.findOne(id);
  }

  @Patch('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateExpertiseDto): Promise<Expertise> {
    return this.expertisesService.update(id, dto);
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.expertisesService.remove(id);
  }
}
