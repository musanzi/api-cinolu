import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Public, Rbac } from '@musanzi/nestjs-session-auth';
import { createCsvUploadOptions } from '@/core/helpers/csv-upload.helper';
import { User } from '@/modules/users/entities/user.entity';
import { FilterParticipationsDto } from '../dto/filter-participations.dto';
import { MoveParticipantsDto } from '../dto/move-participants.dto';
import { ParticipateProjectDto } from '../dto/participate.dto';
import { ProjectParticipation } from '../entities/project-participation.entity';
import { ProjectParticipationService } from '../services/project-participations.service';

@Controller('projects')
export class ProjectParticipationsController {
  constructor(private readonly participationService: ProjectParticipationService) {}

  @Get('id/:projectId/participations')
  @Public()
  findParticipations(
    @Param('projectId') projectId: string,
    @Query() query: FilterParticipationsDto
  ): Promise<[ProjectParticipation[], number]> {
    return this.participationService.findParticipations(projectId, query);
  }

  @Post('participants/move')
  @Rbac({ resource: 'projects', action: 'update' })
  moveParticipants(@Body() dto: MoveParticipantsDto): Promise<void> {
    return this.participationService.moveParticipants(dto);
  }

  @Post('participants/remove')
  @Rbac({ resource: 'projects', action: 'update' })
  removeParticipantsFromPhase(@Body() dto: MoveParticipantsDto): Promise<void> {
    return this.participationService.removeParticipantsFromPhase(dto);
  }

  @Post('participations/:participationId/upvote')
  async upvote(@Param('participationId') participationId: string, @CurrentUser() user: User) {
    return await this.participationService.upvote(participationId, user.id);
  }

  @Delete('participations/:participationId/upvote')
  async unvote(@Param('participationId') participationId: string, @CurrentUser() user: User) {
    return await this.participationService.unvote(participationId, user.id);
  }

  @Post('id/:projectId/participate')
  participate(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: ParticipateProjectDto
  ): Promise<void> {
    return this.participationService.participate(projectId, user, dto);
  }

  @Get('me/participations')
  findUserParticipations(@CurrentUser() user: User): Promise<ProjectParticipation[]> {
    return this.participationService.findUserParticipations(user.id);
  }

  @Get('participations/:participationId')
  findOneParticipation(@Param('participationId') participationId: string): Promise<ProjectParticipation> {
    return this.participationService.findOne(participationId);
  }

  @Post('id/:projectId/participants/import-csv')
  @Rbac({ resource: 'projects', action: 'update' })
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  addParticipantsFromCsv(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<void> {
    return this.participationService.importParticipants(projectId, file);
  }
}
