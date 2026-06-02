import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createCsvUploadOptions } from '@/shared/helpers/csv-upload.helper';
import { CreateUserDto } from '../dto/create-user.dto';
import { FilterUsersDto } from '../dto/filter-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { Public, Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('staff')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  async findStaff(): Promise<User[]> {
    return this.usersService.findStaff();
  }

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get('search')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  search(@Query('term') term: string): Promise<User[]> {
    return this.usersService.search(term);
  }

  @Post('import-csv')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.usersService.importCsv(file);
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.update(userId, dto);
  }

  @Delete('clear')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  clear(): Promise<number> {
    return this.usersService.clear();
  }

  @Delete('id/:userId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('userId') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
