import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Subprogram } from '../entities/subprogram.entity';
import { SubprogramsService } from './subprograms.service';

@Injectable()
export class SubprogramMediaService {
  constructor(private readonly subprogramsService: SubprogramsService) {}

  async addLogo(id: string, file: Express.Multer.File): Promise<Subprogram> {
    try {
      const subprogram = await this.subprogramsService.findOne(id);
      if (subprogram.logo) {
        await fs.unlink(`./uploads/subprograms/${subprogram.logo}`).catch(() => undefined);
      }
      return await this.subprogramsService.setLogo(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }
}
