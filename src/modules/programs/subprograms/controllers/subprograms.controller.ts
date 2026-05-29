import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { CreateSubprogramDto } from '../dto/create-subprogram.dto';
import { UpdateSubprogramDto } from '../dto/update-subprogram.dto';
import { Subprogram } from '../entities/subprogram.entity';
import { SubprogramsService } from '../services/subprograms.service';

@Controller('subprograms')
export class SubprogramsController {
  constructor(private readonly subprogramsService: SubprogramsService) {}

  @Post()
  @Rbac({ resource: 'subprograms', action: 'create' })
  create(@Body() dto: CreateSubprogramDto): Promise<Subprogram> {
    return this.subprogramsService.create(dto);
  }

  @Get()
  @Public()
  findAll(): Promise<Subprogram[]> {
    return this.subprogramsService.findAll();
  }

  @Patch('id/:subprogramId/publish')
  @Rbac({ resource: 'subprograms', action: 'update' })
  togglePublish(@Param('subprogramId') subprogramId: string): Promise<Subprogram> {
    return this.subprogramsService.togglePublish(subprogramId);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Subprogram> {
    return this.subprogramsService.findBySlug(slug);
  }

  @Get('program/:programId')
  @Public()
  findByProgram(@Param('programId') programId: string): Promise<Subprogram[]> {
    return this.subprogramsService.findByProgram(programId);
  }

  @Get('id/:subprogramId')
  @Rbac({ resource: 'subprograms', action: 'update' })
  findOne(@Param('subprogramId') subprogramId: string): Promise<Subprogram> {
    return this.subprogramsService.findOne(subprogramId);
  }

  @Patch('id/:subprogramId/highlight')
  @Rbac({ resource: 'subprograms', action: 'update' })
  toggleHighlight(@Param('subprogramId') subprogramId: string): Promise<Subprogram> {
    return this.subprogramsService.highlight(subprogramId);
  }

  @Patch('id/:subprogramId')
  @Rbac({ resource: 'subprograms', action: 'update' })
  update(@Param('subprogramId') subprogramId: string, @Body() dto: UpdateSubprogramDto): Promise<Subprogram> {
    return this.subprogramsService.update(subprogramId, dto);
  }

  @Delete('id/:subprogramId')
  @Rbac({ resource: 'subprograms', action: 'delete' })
  remove(@Param('subprogramId') subprogramId: string): Promise<void> {
    return this.subprogramsService.remove(subprogramId);
  }
}
