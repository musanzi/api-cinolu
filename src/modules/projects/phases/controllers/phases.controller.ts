import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PhasesService } from '../services/phases.service';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { Phase } from '../entities/phase.entity';
import { Public, Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('phases')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Post('project/:projectId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('phaseId') phaseId: string, @Body() dto: UpdatePhaseDto): Promise<Phase> {
    return this.phasesService.update(phaseId, dto);
  }

  @Delete('id/:phaseId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('phaseId') phaseId: string): Promise<void> {
    return this.phasesService.remove(phaseId);
  }
}
