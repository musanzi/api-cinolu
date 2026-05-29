import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { CreateProgramDto } from '../dto/create-program.dto';
import { FilterProgramsDto } from '../dto/filter-programs.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { Program } from '../entities/program.entity';
import { ProgramsService } from '../services/programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Rbac({ resource: 'programs', action: 'create' })
  create(@Body() dto: CreateProgramDto): Promise<Program> {
    return this.programsService.create(dto);
  }

  @Get('published')
  @Public()
  findPublished(): Promise<Program[]> {
    return this.programsService.findPublished();
  }

  @Patch('id/:programId/publish')
  @Rbac({ resource: 'programs', action: 'update' })
  togglePublish(@Param('programId') programId: string): Promise<Program> {
    return this.programsService.togglePublish(programId);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Program> {
    return this.programsService.findBySlug(slug);
  }

  @Get()
  @Public()
  findAll(): Promise<Program[]> {
    return this.programsService.findAll();
  }

  @Get('paginated')
  @Rbac({ resource: 'programs', action: 'read' })
  findPaginated(@Query() query: FilterProgramsDto): Promise<[Program[], number]> {
    return this.programsService.findFiltered(query);
  }

  @Get('id/:programId')
  @Rbac({ resource: 'programs', action: 'update' })
  findOne(@Param('programId') programId: string): Promise<Program> {
    return this.programsService.findOne(programId);
  }

  @Patch('id/:programId/highlight')
  @Rbac({ resource: 'programs', action: 'update' })
  toggleHighlight(@Param('programId') programId: string): Promise<Program> {
    return this.programsService.highlight(programId);
  }

  @Patch('id/:programId')
  @Rbac({ resource: 'programs', action: 'update' })
  update(@Param('programId') programId: string, @Body() dto: UpdateProgramDto): Promise<Program> {
    return this.programsService.update(programId, dto);
  }

  @Delete('id/:programId')
  @Rbac({ resource: 'programs', action: 'delete' })
  remove(@Param('programId') programId: string): Promise<void> {
    return this.programsService.remove(programId);
  }
}
