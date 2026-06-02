import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Program } from '../entities/program.entity';
import { ProgramMediaService } from '../services/program-media.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('programs')
export class ProgramMediaController {
  constructor(private readonly programMediaService: ProgramMediaService) {}

  @Post('id/:programId/logo')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('logo', createDiskUploadOptions('./uploads/programs')))
  addLogo(@Param('programId') programId: string, @UploadedFile() file: Express.Multer.File): Promise<Program> {
    return this.programMediaService.addLogo(programId, file);
  }
}
