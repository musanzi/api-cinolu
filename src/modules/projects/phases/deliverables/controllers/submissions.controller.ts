import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { DeliverableSubmission } from '../entities/submission.entity';
import { SubmissionsService } from '../services/submissions.service';
import { DelivrableParams } from '../types/deliverables.types';

@Controller('deliverables')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('id/:deliverableId/participations/:participationId/submissions')
  @UseInterceptors(FileInterceptor('file', createDiskUploadOptions('./uploads/deliverables')))
  submitDeliverable(
    @Param() params: DelivrableParams,
    @UploadedFile() file: Express.Multer.File
  ): Promise<DeliverableSubmission> {
    return this.submissionsService.submitDeliverable(params, file);
  }
}
