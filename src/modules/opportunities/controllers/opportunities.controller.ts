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
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { FilterOpportunitiesInterface } from '../interfaces/filter-opportunities.interface';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunitiesService } from '../services/opportunities.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateOpportunityDto): Promise<Opportunity> {
    return this.opportunitiesService.create(dto);
  }

  @Get()
  @Public()
  findAll(@Query() query: FilterOpportunitiesInterface): Promise<Opportunity[]> {
    return this.opportunitiesService.findAll(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findOne(@Param('slug') slug: string): Promise<Opportunity> {
    return this.opportunitiesService.findOne(slug);
  }

  @Patch('id/:opportunityId')
  @HasRoles([Roles.STAFF])
  update(@Param('opportunityId') opportunityId: string, @Body() dto: UpdateOpportunityDto): Promise<Opportunity> {
    return this.opportunitiesService.update(opportunityId, dto);
  }

  @Post('id/:opportunityId/cover')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/opportunities')))
  addCover(@Param('opportunityId') id: string, @UploadedFile() file: Express.Multer.File): Promise<Opportunity> {
    return this.opportunitiesService.addCover(id, file.filename);
  }

  @Delete('id/:opportunityId')
  @HasRoles([Roles.STAFF])
  remove(@Param('opportunityId') opportunityId: string): Promise<void> {
    return this.opportunitiesService.remove(opportunityId);
  }
}
