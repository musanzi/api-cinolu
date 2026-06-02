import { Public } from '@/modules/auth/decorators/public.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { FilterOpportunitiesDto } from '../dto/filter-opportunities.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunitiesService } from '../services/opportunities.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateOpportunityDto): Promise<Opportunity> {
    return this.opportunitiesService.create(dto);
  }

  @Get()
  @Public()
  findAll(@Query() query: FilterOpportunitiesDto): Promise<Opportunity[]> {
    return this.opportunitiesService.findAll(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findOne(@Param('slug') slug: string): Promise<Opportunity> {
    return this.opportunitiesService.findOne(slug);
  }

  @Patch('id/:opportunityId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('opportunityId') opportunityId: string, @Body() dto: UpdateOpportunityDto): Promise<Opportunity> {
    return this.opportunitiesService.update(opportunityId, dto);
  }

  @Delete('id/:opportunityId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('opportunityId') opportunityId: string): Promise<void> {
    return this.opportunitiesService.remove(opportunityId);
  }
}
