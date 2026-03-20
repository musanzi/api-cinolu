import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Program } from '../entities/program.entity';
import { ProgramMediaService } from '../services/program-media.service';

@Controller('programs')
export class ProgramMediaController {
  constructor(private readonly programMediaService: ProgramMediaService) {}

  @Post('id/:programId/logo')
  @Rbac({ resource: 'programs', action: 'update' })
  @UseInterceptors(FileInterceptor('logo', createDiskUploadOptions('./uploads/programs')))
  addLogo(@Param('programId') programId: string, @UploadedFile() file: Express.Multer.File): Promise<Program> {
    return this.programMediaService.addLogo(programId, file);
  }
}
