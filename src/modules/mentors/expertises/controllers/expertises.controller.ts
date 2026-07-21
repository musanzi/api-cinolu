import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExpertisesService } from '../expertises.service';
import { CreateExpertiseDto } from '../dto/create-expertise.dto';
import { UpdateExpertiseDto } from '../dto/update-expertise.dto';
import { Expertise } from '../entities/expertise.entity';
import { FilterExpertisesInterface } from '../interfaces/filter-expertises.interface';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('expertises')
export class ExpertisesController {
  constructor(private readonly expertisesService: ExpertisesService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateExpertiseDto): Promise<Expertise> {
    return this.expertisesService.create(dto);
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterExpertisesInterface): Promise<[Expertise[], number]> {
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
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateExpertiseDto): Promise<Expertise> {
    return this.expertisesService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.expertisesService.remove(id);
  }
}
