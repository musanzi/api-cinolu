import { Public } from '@/modules/auth/decorators/public.decorator';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { FilterResourcesInterface } from '../interfaces/filter-resources.interface';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { Resource } from '../entities/resource.entity';
import { ResourcesService } from '../services/resources.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('project/:projectId')
  findByProject(
    @Param('projectId') projectId: string,
    @Query() query: FilterResourcesInterface
  ): Promise<[Resource[], number]> {
    return this.resourcesService.findByProject(projectId, query);
  }

  @Get('phase/:phaseId')
  @Public()
  findByPhase(
    @Param('phaseId') phaseId: string,
    @Query() query: FilterResourcesInterface
  ): Promise<[Resource[], number]> {
    return this.resourcesService.findByPhase(phaseId, query);
  }

  @Post()
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('file', createDiskUploadOptions('./uploads/resources')))
  create(@Body() dto: CreateResourceDto, @UploadedFile() file: Express.Multer.File): Promise<Resource> {
    return this.resourcesService.create(dto, file);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto): Promise<Resource> {
    return this.resourcesService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.resourcesService.remove(id);
  }
}
