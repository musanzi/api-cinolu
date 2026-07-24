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
import { CreateMentorDto } from '../dto/create-mentor.dto';
import { FilterMentorsInterface } from '../interfaces/filter-mentors.interface';
import { MentorRequestDto } from '../dto/mentor-request.dto';
import { UpdateMentorDto } from '../dto/update-mentor.dto';
import { UpdateMentorRequestDto } from '../dto/update-mentor-request.dto';
import { MentorProfile } from '../entities/mentor.entity';
import { MentorsService } from '../services/mentors.service';
import { CurrentUser, HasRoles } from '@/modules/auth/decorators';
import { User } from '@/modules/users/entities/user.entity';
import { Roles } from '@/modules/auth/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';

@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@Body() dto: CreateMentorDto): Promise<MentorProfile> {
    return this.mentorsService.create(dto);
  }

  @Post('request')
  submitRequest(@CurrentUser() user: User, @Body() dto: MentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.submitRequest(user.id, dto);
  }

  @Patch('requests/:mentorId')
  updateRequest(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.updateRequest(mentorId, dto);
  }

  @Patch('applications/:mentorId')
  updateMentor(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorDto): Promise<MentorProfile> {
    return this.mentorsService.updateMentor(mentorId, dto);
  }

  @Get('paginated')
  @HasRoles([Roles.STAFF])
  findPaginated(@Query() query: FilterMentorsInterface): Promise<[MentorProfile[], number]> {
    return this.mentorsService.findFiltered(query);
  }

  @Patch('id/:mentorId/approve')
  @HasRoles([Roles.STAFF])
  approve(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.approve(mentorId);
  }

  @Patch('id/:mentorId/reject')
  @HasRoles([Roles.STAFF])
  reject(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.reject(mentorId);
  }

  @Get('me')
  findByUser(@CurrentUser() user: User): Promise<MentorProfile[]> {
    return this.mentorsService.findByUser(user.id);
  }

  @Get()
  @HasRoles([Roles.STAFF])
  findApproved(): Promise<MentorProfile[]> {
    return this.mentorsService.findApproved();
  }

  @Get('id/:mentorId')
  findOne(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.findOne(mentorId);
  }

  @Patch('id/:mentorId')
  @HasRoles([Roles.STAFF])
  update(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.update(mentorId, dto);
  }

  @Delete('id/:mentorId')
  @HasRoles([Roles.STAFF])
  remove(@Param('mentorId') mentorId: string): Promise<void> {
    return this.mentorsService.remove(mentorId);
  }

  @Post('id/:mentorId/cv')
  @UseInterceptors(FileInterceptor('cv', createDiskUploadOptions('./uploads/mentors/cvs')))
  addCv(@Param('mentorId') mentorId: string, @UploadedFile() file: Express.Multer.File): Promise<MentorProfile> {
    return this.mentorsService.uploadCv(mentorId, file);
  }
}
