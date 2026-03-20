import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Rbac } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { CreateMentorDto } from '../dto/create-mentor.dto';
import { FilterMentorsDto } from '../dto/filter-mentors.dto';
import { MentorRequestDto } from '../dto/mentor-request.dto';
import { UpdateMentorDto } from '../dto/update-mentor.dto';
import { UpdateMentorRequestDto } from '../dto/update-mentor-request.dto';
import { MentorProfile } from '../entities/mentor.entity';
import { MentorsService } from '../services/mentors.service';

@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Post()
  @Rbac({ resource: 'mentors', action: 'create' })
  create(@Body() dto: CreateMentorDto): Promise<MentorProfile> {
    return this.mentorsService.create(dto);
  }

  @Post('request')
  submitRequest(@CurrentUser() user: User, @Body() dto: MentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.submitRequest(user, dto);
  }

  @Patch('requests/:mentorId')
  updateRequest(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.updateRequest(mentorId, dto);
  }

  @Patch('applications/:mentorId')
  @Rbac({ resource: 'mentorApplications', action: 'update' })
  updateMentor(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorDto): Promise<MentorProfile> {
    return this.mentorsService.updateMentor(mentorId, dto);
  }

  @Get('paginated')
  @Rbac({ resource: 'mentors', action: 'read' })
  findPaginated(@Query() query: FilterMentorsDto): Promise<[MentorProfile[], number]> {
    return this.mentorsService.findFiltered(query);
  }

  @Patch('id/:mentorId/approve')
  @Rbac({ resource: 'mentorApplications', action: 'update' })
  approve(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.approve(mentorId);
  }

  @Patch('id/:mentorId/reject')
  @Rbac({ resource: 'mentorApplications', action: 'update' })
  reject(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.reject(mentorId);
  }

  @Get('me')
  findByUser(@CurrentUser() user: User): Promise<MentorProfile[]> {
    return this.mentorsService.findByUser(user);
  }

  @Get()
  @Rbac({ resource: 'mentors', action: 'read' })
  findApproved(): Promise<MentorProfile[]> {
    return this.mentorsService.findApproved();
  }

  @Get('id/:mentorId')
  @Rbac({ resource: 'mentors', action: 'read' })
  findOne(@Param('mentorId') mentorId: string): Promise<MentorProfile> {
    return this.mentorsService.findOne(mentorId);
  }

  @Patch('id/:mentorId')
  @Rbac({ resource: 'mentors', action: 'update' })
  update(@Param('mentorId') mentorId: string, @Body() dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    return this.mentorsService.update(mentorId, dto);
  }

  @Delete('id/:mentorId')
  @Rbac({ resource: 'mentors', action: 'delete' })
  remove(@Param('mentorId') mentorId: string): Promise<void> {
    return this.mentorsService.remove(mentorId);
  }
}
