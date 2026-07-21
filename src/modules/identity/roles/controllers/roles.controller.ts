import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { FilterRolesInterface } from '../interfaces/filter-roles.interface';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterRolesInterface): Promise<[Role[], number]> {
    return this.rolesService.findAllPaginated(query);
  }

  @Get()
  @HasRoles([Roles.STAFF])
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get('id/:id')
  @HasRoles([Roles.STAFF])
  findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch('id/:id')
  @HasRoles([Roles.STAFF])
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete('id/:id')
  @HasRoles([Roles.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }
}
