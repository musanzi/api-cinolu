import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { FilterRolesInterface } from '../interfaces/filter-roles.interface';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Get('paginated')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: FilterRolesInterface): Promise<[Role[], number]> {
    return this.rolesService.findAllPaginated(query);
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }
}
