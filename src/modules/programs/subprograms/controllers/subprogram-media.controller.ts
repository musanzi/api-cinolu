import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Subprogram } from '../entities/subprogram.entity';
import { SubprogramMediaService } from '../services/subprogram-media.service';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';

@Controller('subprograms')
export class SubprogramMediaController {
  constructor(private readonly subprogramMediaService: SubprogramMediaService) {}

  @Post('id/:subprogramId/logo')
  @HasRoles([Roles.STAFF])
  @UseInterceptors(FileInterceptor('logo', createDiskUploadOptions('./uploads/subprograms')))
  addLogo(@Param('subprogramId') subprogramId: string, @UploadedFile() file: Express.Multer.File): Promise<Subprogram> {
    return this.subprogramMediaService.addLogo(subprogramId, file);
  }
}
