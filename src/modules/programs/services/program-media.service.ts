import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Program } from '../entities/program.entity';
import { ProgramsService } from './programs.service';

@Injectable()
export class ProgramMediaService {
  constructor(private readonly programsService: ProgramsService) {}

  async addLogo(id: string, file: Express.Multer.File): Promise<Program> {
    try {
      const program = await this.programsService.findOne(id);
      if (program.logo) {
        await fs.unlink(`./uploads/programs/${program.logo}`).catch(() => undefined);
      }
      return await this.programsService.setLogo(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }
}
