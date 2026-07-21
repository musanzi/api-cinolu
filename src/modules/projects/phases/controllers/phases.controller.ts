import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PhasesService } from '../services/phases.service';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { Phase } from '../entities/phase.entity';
import { Public, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('phases')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Post('project/:projectId')
  @HasRoles([Roles.STAFF])
  create(@Param('projectId') projectId: string, @Body() dto: CreatePhaseDto): Promise<Phase> {
    return this.phasesService.create(projectId, dto);
  }

  @Get('id/:phaseId')
  @Public()
  findOne(@Param('phaseId') phaseId: string): Promise<Phase> {
    return this.phasesService.findOne(phaseId);
  }

  @Get('project/:projectId')
  @Public()
  findAllByProject(@Param('projectId') projectId: string): Promise<Phase[]> {
    return this.phasesService.findAll(projectId);
  }

  @Patch('id/:phaseId')
  @HasRoles([Roles.STAFF])
  update(@Param('phaseId') phaseId: string, @Body() dto: UpdatePhaseDto): Promise<Phase> {
    return this.phasesService.update(phaseId, dto);
  }

  @Delete('id/:phaseId')
  @HasRoles([Roles.STAFF])
  remove(@Param('phaseId') phaseId: string): Promise<void> {
    return this.phasesService.remove(phaseId);
  }
}
