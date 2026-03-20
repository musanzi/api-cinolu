import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Public, Rbac } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { CreateVentureDto } from '../dto/create-venture.dto';
import { FilterVenturesDto } from '../dto/filter-ventures.dto';
import { UpdateVentureDto } from '../dto/update-venture.dto';
import { Venture } from '../entities/venture.entity';
import { VenturesService } from '../services/ventures.service';

@Controller('ventures')
export class VenturesController {
  constructor(private readonly venturesService: VenturesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateVentureDto): Promise<Venture> {
    return this.venturesService.create(user, dto);
  }

  @Get('published')
  @Public()
  findPublished(): Promise<Venture[]> {
    return this.venturesService.findPublished();
  }

  @Get()
  @Rbac({ resource: 'ventures', action: 'read' })
  findAll(@Query() query: FilterVenturesDto): Promise<[Venture[], number]> {
    return this.venturesService.findAll(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Venture> {
    return this.venturesService.findBySlug(slug);
  }

  @Patch('by-slug/:slug/publish')
  @Rbac({ resource: 'publishVenture', action: 'update' })
  togglePublish(@Param('slug') slug: string): Promise<Venture> {
    return this.venturesService.togglePublish(slug);
  }

  @Get('me/paginated')
  findMinePaginated(@Query('page') page: string, @CurrentUser() user: User): Promise<[Venture[], number]> {
    return this.venturesService.findByUser(page, user);
  }

  @Get('me')
  findMine(@CurrentUser() user: User): Promise<Venture[]> {
    return this.venturesService.findByUserUnpaginated(user);
  }

  @Get('id/:ventureId')
  findOne(@Param('ventureId') ventureId: string): Promise<Venture> {
    return this.venturesService.findOne(ventureId);
  }

  @Patch('by-slug/:slug')
  @Rbac({ resource: 'ventures', action: 'update' })
  update(@Param('slug') slug: string, @Body() dto: UpdateVentureDto): Promise<Venture> {
    return this.venturesService.update(slug, dto);
  }

  @Delete('id/:id')
  @Rbac({ resource: 'ventures', action: 'delete' })
  remove(@Param('id') id: string): Promise<void> {
    return this.venturesService.remove(id);
  }
}
