import { Controller, Get, Query, Res } from '@nestjs/common';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { Response } from 'express';
import { FilterUsersDto } from '../dto/filter-users.dto';
import { UsersExportService } from '../services/users-export.service';

@Controller('users')
export class UsersExportController {
  constructor(private readonly usersExportService: UsersExportService) {}

  @Get('export/users.csv')
  @Rbac({ resource: 'exportUsersCSV', action: 'read' })
  async exportCSV(@Query() query: FilterUsersDto, @Res() res: Response): Promise<void> {
    await this.usersExportService.exportCSV(query, res);
  }
}
