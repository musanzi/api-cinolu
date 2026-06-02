import { Controller, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityMediaService } from '../services/opportunity-media.service';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('opportunities')
export class OpportunityMediaController {
  constructor(private readonly opportunityMediaService: OpportunityMediaService) {}

  @Post('id/:opportunityId/cover')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/opportunities')))
  addCover(
    @Param('opportunityId') opportunityId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<Opportunity> {
    return this.opportunityMediaService.addCover(opportunityId, file);
  }

  @Patch('id/:opportunityId/cover')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('cover', createDiskUploadOptions('./uploads/opportunities')))
  updateCover(
    @Param('opportunityId') opportunityId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<Opportunity> {
    return this.opportunityMediaService.updateCover(opportunityId, file);
  }
}
