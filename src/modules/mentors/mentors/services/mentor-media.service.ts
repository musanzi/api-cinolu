import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { MentorProfile } from '../entities/mentor.entity';
import { MentorsService } from './mentors.service';

@Injectable()
export class MentorMediaService {
  constructor(private readonly mentorsService: MentorsService) {}

  async addCv(id: string, file: Express.Multer.File): Promise<MentorProfile> {
    try {
      const mentor = await this.mentorsService.findOne(id);
      if (mentor.cv) {
        await fs.unlink(`./uploads/mentors/cvs/${mentor.cv}`).catch(() => undefined);
      }
      return await this.mentorsService.addCv(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout du CV impossible');
    }
  }
}
