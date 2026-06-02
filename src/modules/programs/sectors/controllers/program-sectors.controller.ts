import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProgramSectorsService } from '../services/sectors.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';
import { ProgramSector } from '../entities/sector.entity';
import { QueryParams } from '../utils/query-params.type';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('program-sectors')
export class ProgramSectorsController {
  constructor(private readonly programSectorsService: ProgramSectorsService) {}

  @Get()
  @Public()
  findAll(): Promise<ProgramSector[]> {
    return this.programSectorsService.findAll();
  }

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateSectorDto): Promise<ProgramSector> {
    return this.programSectorsService.create(dto);
  }

  @Get('paginated')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: QueryParams): Promise<[ProgramSector[], number]> {
    return this.programSectorsService.findPaginated(query);
  }

  @Get('id/:id')
  @Public()
  findOne(@Param('id') id: string): Promise<ProgramSector> {
    return this.programSectorsService.findOne(id);
  }

  @Patch('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('id') id: string, @Body() dto: UpdateSectorDto): Promise<ProgramSector> {
    return this.programSectorsService.update(id, dto);
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.programSectorsService.remove(id);
  }
}
