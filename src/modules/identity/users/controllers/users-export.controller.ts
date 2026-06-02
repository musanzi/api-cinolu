import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { FilterUsersInterface } from '../interfaces/filter-users.interface';
import { UsersExportService } from '../services/users-export.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('users')
export class UsersExportController {
  constructor(private readonly usersExportService: UsersExportService) {}

  @Get('export/users.csv')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  async exportCSV(@Query() query: FilterUsersInterface, @Res() res: Response): Promise<void> {
    await this.usersExportService.exportCSV(query, res);
  }
}
