import { Public } from '@/modules/auth/decorators/public.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateProgramDto } from '../dto/create-program.dto';
import { FilterProgramsInterface } from '../interfaces/filter-programs.interface';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { Program } from '../entities/program.entity';
import { ProgramsService } from '../services/programs.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateProgramDto): Promise<Program> {
    return this.programsService.create(dto);
  }

  @Get('published')
  @Public()
  findPublished(): Promise<Program[]> {
    return this.programsService.findPublished();
  }

  @Patch('id/:programId/publish')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: FilterProgramsInterface): Promise<[Program[], number]> {
    return this.programsService.findFiltered(query);
  }

  @Get('id/:programId')
  @Public()
  findOne(@Param('programId') programId: string): Promise<Program> {
    return this.programsService.findOne(programId);
  }

  @Patch('id/:programId/highlight')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  toggleHighlight(@Param('programId') programId: string): Promise<Program> {
    return this.programsService.highlight(programId);
  }

  @Patch('id/:programId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('programId') programId: string, @Body() dto: UpdateProgramDto): Promise<Program> {
    return this.programsService.update(programId, dto);
  }

  @Delete('id/:programId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('programId') programId: string): Promise<void> {
    return this.programsService.remove(programId);
  }
}
