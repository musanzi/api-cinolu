import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { MentorProfile } from '../entities/mentor.entity';
import { MentorMediaService } from '../services/mentor-media.service';

@Controller('mentors')
export class MentorMediaController {
  constructor(private readonly mentorMediaService: MentorMediaService) {}

  @Post('id/:mentorId/cv')
  @UseInterceptors(FileInterceptor('cv', createDiskUploadOptions('./uploads/mentors/cvs')))
  addCv(@Param('mentorId') mentorId: string, @UploadedFile() file: Express.Multer.File): Promise<MentorProfile> {
    return this.mentorMediaService.addCv(mentorId, file);
  }
}
