import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { createCsvUploadOptions } from '@/core/helpers/csv-upload.helper';
import { CreateUserDto } from '../dto/create-user.dto';
import { FilterUsersDto } from '../dto/filter-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('staff')
  @Rbac({ resource: 'users', action: 'read' })
  async findStaff(): Promise<User[]> {
    return this.usersService.findStaff();
  }

  @Post()
  @Rbac({ resource: 'users', action: 'create' })
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get('search')
  @Rbac({ resource: 'users', action: 'read' })
  search(@Query('term') term: string): Promise<User[]> {
    return this.usersService.search(term);
  }

  @Post('import-csv')
  @Rbac({ resource: 'users', action: 'create' })
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.usersService.importCsv(file);
  }

  @Get()
  @Rbac({ resource: 'users', action: 'read' })
  findAll(@Query() query: FilterUsersDto): Promise<[User[], number]> {
    return this.usersService.findAll(query);
  }

  @Get('entrepreneurs')
  @Public()
  findEntrepreneurs(): Promise<User[]> {
    return this.usersService.findEntrepreneurs();
  }

  @Get('by-email/:email')
  @Public()
  findOneByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findOneByEmail(email);
  }

  @Patch('id/:userId')
  @Rbac({ resource: 'users', action: 'update' })
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.update(userId, dto);
  }

  @Delete('clear')
  @Rbac({ resource: 'users', action: 'delete' })
  clear(): Promise<number> {
    return this.usersService.clear();
  }

  @Delete('id/:userId')
  @Rbac({ resource: 'users', action: 'delete' })
  remove(@Param('userId') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
