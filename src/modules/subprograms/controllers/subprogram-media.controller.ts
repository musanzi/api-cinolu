import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Subprogram } from '../entities/subprogram.entity';
import { SubprogramMediaService } from '../services/subprogram-media.service';

@Controller('subprograms')
export class SubprogramMediaController {
  constructor(private readonly subprogramMediaService: SubprogramMediaService) {}

  @Post('id/:subprogramId/logo')
  @Rbac({ resource: 'subprograms', action: 'update' })
  @UseInterceptors(FileInterceptor('logo', createDiskUploadOptions('./uploads/subprograms')))
  addLogo(@Param('subprogramId') subprogramId: string, @UploadedFile() file: Express.Multer.File): Promise<Subprogram> {
    return this.subprogramMediaService.addLogo(subprogramId, file);
  }
}
