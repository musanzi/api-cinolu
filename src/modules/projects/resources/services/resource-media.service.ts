import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Resource } from '../entities/resource.entity';
import { ResourcesService } from './resources.service';

@Injectable()
export class ResourceMediaService {
  constructor(private readonly resourcesService: ResourcesService) {}

  async updateFile(id: string, file: Express.Multer.File): Promise<Resource> {
    try {
      const resource = await this.resourcesService.findOne(id);
      if (resource.file) await fs.unlink(`./uploads/resources/${resource.file}`);
      return await this.resourcesService.setFile(id, file.filename);
    } catch {
      throw new BadRequestException();
    }
  }
}
