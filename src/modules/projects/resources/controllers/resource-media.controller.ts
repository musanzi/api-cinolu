import { Controller, Param, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Resource } from '../entities/resource.entity';
import { ResourceMediaService } from '../services/resource-media.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('resources')
export class ResourceMediaController {
  constructor(private readonly resourceMediaService: ResourceMediaService) {}

  @Patch('file/:id')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('file', createDiskUploadOptions('./uploads/resources')))
  updateFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File): Promise<Resource> {
    return this.resourceMediaService.updateFile(id, file);
  }
}
