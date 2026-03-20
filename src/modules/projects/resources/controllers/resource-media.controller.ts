import { Controller, Param, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Resource } from '../entities/resource.entity';
import { ResourceMediaService } from '../services/resource-media.service';

@Controller('resources')
export class ResourceMediaController {
  constructor(private readonly resourceMediaService: ResourceMediaService) {}

  @Patch('file/:id')
  @Rbac({ resource: 'resources', action: 'update' })
  @UseInterceptors(FileInterceptor('file', createDiskUploadOptions('./uploads/resources')))
  updateFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File): Promise<Resource> {
    return this.resourceMediaService.updateFile(id, file);
  }
}
