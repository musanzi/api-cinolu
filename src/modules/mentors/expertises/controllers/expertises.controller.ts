import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExpertisesService } from '../expertises.service';
import { CreateExpertiseDto } from '../dto/create-expertise.dto';
import { UpdateExpertiseDto } from '../dto/update-expertise.dto';
import { Expertise } from '../entities/expertise.entity';
import { FilterExpertisesDto } from '../dto/filter-expertises.dto';
import { Rbac } from '@musanzi/nestjs-session-auth';

@Controller('expertises')
export class ExpertisesController {
  constructor(private readonly expertisesService: ExpertisesService) {}

  @Post()
  @Rbac({ resource: 'expertises', action: 'create' })
  create(@Body() dto: CreateExpertiseDto): Promise<Expertise> {
    return this.expertisesService.create(dto);
  }

  @Get('paginated')
  @Rbac({ resource: 'expertises', action: 'read' })
  findPaginated(@Query() query: FilterExpertisesDto): Promise<[Expertise[], number]> {
    return this.expertisesService.findFiltered(query);
  }

  @Get()
  findAll(): Promise<Expertise[]> {
    return this.expertisesService.findAll();
  }

  @Get('id/:id')
  @Rbac({ resource: 'expertises', action: 'read' })
  findOne(@Param('id') id: string): Promise<Expertise> {
    return this.expertisesService.findOne(id);
  }

  @Patch('id/:id')
  @Rbac({ resource: 'expertises', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateExpertiseDto): Promise<Expertise> {
    return this.expertisesService.update(id, dto);
  }

  @Delete('id/:id')
  @Rbac({ resource: 'expertises', action: 'delete' })
  remove(@Param('id') id: string): Promise<void> {
    return this.expertisesService.remove(id);
  }
}
