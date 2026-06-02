import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateProjectDto } from '../dto/create-project.dto';
import { FilterProjectsInterface } from '../interfaces/filter-projects.interface';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Project } from '../entities/project.entity';
import { ProjectsService } from '../services/projects.service';
import { CurrentUser, Public, Roles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(dto);
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  togglePublish(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectsService.togglePublish(projectId);
  }

  @Patch('id/:projectId/highlight')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  toggleHighlight(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectsService.toggleHighlight(projectId);
  }

  @Patch('id/:projectId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('projectId') projectId: string, @Body() dto: UpdateProjectDto): Promise<Project> {
    return this.projectsService.update(projectId, dto);
  }

  @Delete('id/:projectId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('projectId') projectId: string): Promise<void> {
    return this.projectsService.remove(projectId);
  }
}
