import { Public } from '@/modules/auth/decorators/public.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateSubprogramDto } from '../dto/create-subprogram.dto';
import { UpdateSubprogramDto } from '../dto/update-subprogram.dto';
import { Subprogram } from '../entities/subprogram.entity';
import { SubprogramsService } from '../services/subprograms.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('subprograms')
export class SubprogramsController {
  constructor(private readonly subprogramsService: SubprogramsService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateSubprogramDto): Promise<Subprogram> {
    return this.subprogramsService.create(dto);
  }

  @Get()
  @Public()
  findAll(): Promise<Subprogram[]> {
    return this.subprogramsService.findAll();
  }

  @Patch('id/:subprogramId/publish')
  @HasRoles([Roles.STAFF])
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
  @Public()
  findOne(@Param('subprogramId') subprogramId: string): Promise<Subprogram> {
    return this.subprogramsService.findOne(subprogramId);
  }

  @Patch('id/:subprogramId/highlight')
  @HasRoles([Roles.STAFF])
  toggleHighlight(@Param('subprogramId') subprogramId: string): Promise<Subprogram> {
    return this.subprogramsService.highlight(subprogramId);
  }

  @Patch('id/:subprogramId')
  @HasRoles([Roles.STAFF])
  update(@Param('subprogramId') subprogramId: string, @Body() dto: UpdateSubprogramDto): Promise<Subprogram> {
    return this.subprogramsService.update(subprogramId, dto);
  }

  @Delete('id/:subprogramId')
  @HasRoles([Roles.STAFF])
  remove(@Param('subprogramId') subprogramId: string): Promise<void> {
    return this.subprogramsService.remove(subprogramId);
  }
}
