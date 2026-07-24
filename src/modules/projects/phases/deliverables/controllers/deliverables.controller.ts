import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { DeliverableSubmission } from '../entities/submission.entity';
import { DeliverablesService } from '../services/deliverables.service';
import { DelivrableParams } from '../types/deliverables.types';

@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post('id/:deliverableId/participations/:participationId/submissions')
  @UseInterceptors(FileInterceptor('file', createDiskUploadOptions('./uploads/deliverables')))
  submitDeliverable(
    @Param() params: DelivrableParams,
    @UploadedFile() file: Express.Multer.File
  ): Promise<DeliverableSubmission> {
    return this.deliverablesService.submitDeliverable(params, file);
  }
}
