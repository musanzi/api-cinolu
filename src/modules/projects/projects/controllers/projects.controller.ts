import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { CreateProjectDto } from '../dto/create-project.dto';
import { FilterProjectsInterface } from '../interfaces/filter-projects.interface';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Project } from '../entities/project.entity';
import { ProjectsService } from '../services/projects.service';
import { CurrentUser, Public, HasRoles } from '@/modules/auth/decorators';
import { User } from '@/modules/users/entities/user.entity';
import { Roles } from '@/modules/auth/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { createCsvUploadOptions } from '@/shared/helpers/csv-upload.helper';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { FilterParticipationsInterface } from '../interfaces/filter-participations.interface';
import { MoveParticipantsDto } from '../dto/move-participants.dto';
import { ParticipateProjectDto } from '../dto/participate.dto';
import { ProjectParticipation } from '../entities/project-participation.entity';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { UpdateParticipationReviewDto } from '../dto/update-participation-review.dto';
import { CreateNotificationDto } from '../../../notifications/dto/create-notification.dto';
import { Notification } from '../../../notifications/entities/notification.entity';
import { Gallery } from '../../../galleries/entities/gallery.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(dto);
  }

  @Get()
  @HasRoles([Roles.STAFF])
  findAll(@Query() query: FilterProjectsInterface): Promise<[Project[], number]> {
    return this.projectsService.findAll(query);
  }

  @Get('recent')
  @Public()
  findRecent(): Promise<Project[]> {
    return this.projectsService.findRecent();
  }

  @Get('published')
  @Public()
  findPublished(@Query() query: FilterProjectsInterface): Promise<[Project[], number]> {
    return this.projectsService.findPublished(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Project> {
    return this.projectsService.findBySlug(slug);
  }

  @Get('me/mentored-projects')
  findMentorProjects(@CurrentUser() user: User): Promise<Project[]> {
    return this.projectsService.findMentorProjects(user.id);
  }

  @Get('id/:projectId')
  @Public()
  findOne(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectsService.findOne(projectId);
  }

  @Patch('id/:projectId/publish')
  @HasRoles([Roles.STAFF])
  togglePublish(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectsService.togglePublish(projectId);
  }

  @Patch('id/:projectId/highlight')
  @HasRoles([Roles.STAFF])
  toggleHighlight(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectsService.toggleHighlight(projectId);
  }

  @Patch('id/:projectId')
  @HasRoles([Roles.STAFF])
  update(@Param('projectId') projectId: string, @Body() dto: UpdateProjectDto): Promise<Project> {
    return this.projectsService.update(projectId, dto);
  }

  @Delete('id/:projectId')
  @HasRoles([Roles.STAFF])
  remove(@Param('projectId') projectId: string): Promise<void> {
    return this.projectsService.remove(projectId);
  }

  @Get('id/:projectId/participations')
  @Public()
  findParticipations(
    @Param('projectId') projectId: string,
    @Query() query: FilterParticipationsInterface
  ): Promise<[ProjectParticipation[], number]> {
    return this.projectsService.findParticipations(projectId, query);
  }

  @Post('participants/move')
  @HasRoles([Roles.STAFF])
  moveParticipants(@Body() dto: MoveParticipantsDto): Promise<void> {
    return this.projectsService.moveParticipants(dto);
  }

  @Post('participants/remove')
  @HasRoles([Roles.STAFF])
  removeParticipantsFromPhase(@Body() dto: MoveParticipantsDto): Promise<void> {
    return this.projectsService.removeParticipantsFromPhase(dto);
  }

  @Post('participations/:participationId/upvote')
  async upvote(@Param('participationId') participationId: string, @CurrentUser() user: User): Promise<void> {
    await this.projectsService.upvote(participationId, user.id);
  }

  @Delete('participations/:participationId/upvote')
  async unvote(@Param('participationId') participationId: string, @CurrentUser() user: User): Promise<void> {
    await this.projectsService.unvote(participationId, user.id);
  }

  @Post('id/:projectId/participate')
  participate(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: ParticipateProjectDto
  ): Promise<void> {
    return this.projectsService.participate(projectId, user.id, dto);
  }

  @Get('me/participations')
  findUserParticipations(@CurrentUser() user: User): Promise<ProjectParticipation[]> {
    return this.projectsService.findUserParticipations(user.id);
  }

  @Get('participations/:participationId')
  @HasRoles([Roles.STAFF])
  findOneParticipation(@Param('participationId') participationId: string): Promise<ProjectParticipation> {
    return this.projectsService.findParticipation(participationId);
  }

  @Post('id/:projectId/participants/import-csv')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  addParticipantsFromCsv(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<void> {
    return this.projectsService.importParticipants(projectId, file);
  }

  @Post('participations/:participationId/review')
  @HasRoles([Roles.STAFF])
  createReview(
    @Param('participationId') participationId: string,
    @CurrentUser() user: User,
    @Body() dto: ParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.projectsService.createReview(participationId, user.id, dto);
  }

  @Patch('participations/:participationId/review/:reviewId')
  @HasRoles([Roles.STAFF])
  updateReview(
    @Param('participationId') participationId: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    return this.projectsService.updateReview(participationId, reviewId, user.id, dto);
  }

  @Post('id/:projectId/notifications')
  @HasRoles([Roles.STAFF])
  createNotification(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateNotificationDto
  ): Promise<Notification> {
    return this.projectsService.createNotification(projectId, user.id, dto);
  }

  @Post('notifications/:notificationId/send')
  sendNotification(@Param('notificationId') notificationId: string): Promise<Notification> {
    return this.projectsService.sendNotification(notificationId);
  }

  @Post('id/:projectId/gallery')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.projectsService.addImage(projectId, file);
  }

  @Delete('gallery/:galleryId')
  @HasRoles([Roles.STAFF])
  removeImage(@Param('galleryId') galleryId: string): Promise<void> {
    return this.projectsService.removeImage(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.projectsService.findGallery(slug);
  }

  @Post('id/:projectId/cover')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/projects')))
  addCover(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File): Promise<Project> {
    return this.projectsService.uploadCover(projectId, file);
  }
}
