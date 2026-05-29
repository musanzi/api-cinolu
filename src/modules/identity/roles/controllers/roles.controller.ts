import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RolesService } from '../roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { FilterRolesDto } from '../dto/filter-roles.dto';
import { Rbac } from '@musanzi/nestjs-session-auth';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Rbac({ resource: 'roles', action: 'create' })
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Get('paginated')
  @Rbac({ resource: 'roles', action: 'read' })
  findPaginated(@Query() query: FilterRolesDto): Promise<[Role[], number]> {
    return this.rolesService.findAllPaginated(query);
  }

  @Get()
  @Rbac({ resource: 'roles', action: 'read' })
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get('id/:id')
  @Rbac({ resource: 'roles', action: 'read' })
  findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch('id/:id')
  @Rbac({ resource: 'roles', action: 'update' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete('id/:id')
  @Rbac({ resource: 'roles', action: 'delete' })
  remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }
}
