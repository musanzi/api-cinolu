import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateVentureDto } from '../dto/create-venture.dto';
import { FilterVenturesInterface } from '../interfaces/filter-ventures.interface';
import { UpdateVentureDto } from '../dto/update-venture.dto';
import { Venture } from '../entities/venture.entity';
import { VenturesService } from '../services/ventures.service';
import { CurrentUser, Public } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';

@Controller('ventures')
export class VenturesController {
  constructor(private readonly venturesService: VenturesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateVentureDto): Promise<Venture> {
    return this.venturesService.create(user.id, dto);
  }

  @Get('published')
  @Public()
  findPublished(): Promise<Venture[]> {
    return this.venturesService.findPublished();
  }

  @Get()
  findAll(@Query() query: FilterVenturesInterface): Promise<[Venture[], number]> {
    return this.venturesService.findAll(query);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Venture> {
    return this.venturesService.findBySlug(slug);
  }

  @Patch('by-slug/:slug/publish')
  togglePublish(@Param('slug') slug: string): Promise<Venture> {
    return this.venturesService.togglePublish(slug);
  }

  @Get('me/paginated')
  findMinePaginated(@Query('page') page: string, @CurrentUser() user: User): Promise<[Venture[], number]> {
    return this.venturesService.findByUser(page, user.id);
  }

  @Get('me')
  findMine(@CurrentUser() user: User): Promise<Venture[]> {
    return this.venturesService.findByUserUnpaginated(user.id);
  }

  @Get('id/:ventureId')
  findOne(@Param('ventureId') ventureId: string): Promise<Venture> {
    return this.venturesService.findOne(ventureId);
  }

  @Patch('by-slug/:slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateVentureDto): Promise<Venture> {
    return this.venturesService.update(slug, dto);
  }

  @Delete('id/:id')
  remove(@Param('id') id: string): Promise<void> {
    return this.venturesService.remove(id);
  }
}
