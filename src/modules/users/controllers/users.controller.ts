import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createCsvUploadOptions } from '@/shared/helpers/csv-upload.helper';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { CreateUserDto } from '../dto/create-user.dto';
import { FilterUsersInterface } from '../interfaces/filter-users.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { CurrentUser, Public, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('staff')
  @HasRoles([Roles.STAFF])
  async findStaff(): Promise<User[]> {
    return this.usersService.findStaff();
  }

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get('search')
  @HasRoles([Roles.STAFF])
  search(@Query('term') term: string): Promise<User[]> {
    return this.usersService.search(term);
  }

  @Post('import-csv')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.usersService.importCsv(file);
  }

  @Get()
  @HasRoles([Roles.STAFF])
  findAll(@Query() query: FilterUsersInterface): Promise<[User[], number]> {
    return this.usersService.findAll(query);
  }

  @Get('entrepreneurs')
  @Public()
  findEntrepreneurs(): Promise<User[]> {
    return this.usersService.findEntrepreneurs();
  }

  @Post('referral-code/generate')
  generateReferralLink(@CurrentUser() user: User): Promise<User> {
    return this.usersService.saveReferralCode(user);
  }

  @Get('ambassadors')
  @Public()
  findAmbassadors(): Promise<[User[], number]> {
    return this.usersService.findAmbassadors();
  }

  @Get('ambassadors/:email')
  @Public()
  findAmbassadorByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findAmbassadorByEmail(email);
  }

  @Get('me/referred-users')
  findReferredUsers(@Query('page') page: number, @CurrentUser() user: User): Promise<[User[], number]> {
    return this.usersService.referredUsers(page, user);
  }

  @Get('export/users.csv')
  @HasRoles([Roles.STAFF])
  async exportCSV(@Query() query: FilterUsersInterface, @Res() res: Response): Promise<void> {
    await this.usersService.exportCSV(query, res);
  }

  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('profile', createDiskUploadOptions('./uploads/profiles')))
  uploadImage(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<User> {
    return this.usersService.uploadImage(user, file);
  }

  @Get('by-email/:email')
  @Public()
  findOneByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findOneByEmail(email);
  }

  @Patch('id/:userId')
  @HasRoles([Roles.STAFF])
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.update(userId, dto);
  }

  @Delete('id/:userId')
  @HasRoles([Roles.STAFF])
  remove(@Param('userId') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
