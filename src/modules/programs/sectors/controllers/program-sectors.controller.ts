import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProgramSectorsService } from '../services/sectors.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';
import { ProgramSector } from '../entities/sector.entity';
import { FilterSectorsInterface } from '../interfaces/filter-sectors.interface';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('program-sectors')
export class ProgramSectorsController {
  constructor(private readonly programSectorsService: ProgramSectorsService) {}

  @Get()
  @Public()
  findAll(): Promise<ProgramSector[]> {
    return this.programSectorsService.findAll();
  }

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateSectorDto): Promise<ProgramSector> {
    return this.programSectorsService.create(dto);
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterSectorsInterface): Promise<[ProgramSector[], number]> {
    return this.programSectorsService.findPaginated(query);
  }

  @Get('id/:id')
  @Public()
  findOne(@Param('id') id: string): Promise<ProgramSector> {
    return this.programSectorsService.findOne(id);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateSectorDto): Promise<ProgramSector> {
    return this.programSectorsService.update(id, dto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.programSectorsService.remove(id);
  }
}
