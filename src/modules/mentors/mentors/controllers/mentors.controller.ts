import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateMentorDto } from '../dto/create-mentor.dto';
import { FilterMentorsDto } from '../dto/filter-mentors.dto';
import { MentorRequestDto } from '../dto/mentor-request.dto';
import { UpdateMentorDto } from '../dto/update-mentor.dto';
import { UpdateMentorRequestDto } from '../dto/update-mentor-request.dto';
import { MentorProfile } from '../entities/mentor.entity';
import { MentorsService } from '../services/mentors.service';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: FilterMentorsDto): Promise<[MentorProfile[], number]> {
    return this.mentorsService.findFiltered(query);
  }

  @Patch('id/:mentorId/approve')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  approve(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.approve(mentorId);
  }

  @Patch('id/:mentorId/reject')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  reject(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.reject(mentorId);
  }

  @Get('me')
  findByUser(@CurrentUser() user: User): Promise<MentorProfile[]> {
    return this.mentorsService.findByUser(user.id);
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findApproved(): Promise<MentorProfile[]> {
    return this.mentorsService.findApproved();
  }

  @Get('id/:mentorId')
  findOne(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.findOne(mentorId);
  }

  @Patch('id/:mentorId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.update(mentorId, dto);
  }

  @Delete('id/:mentorId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('mentorId') mentorId: string): Promise<void> {
    return this.mentorsService.remove(mentorId);
  }
}
