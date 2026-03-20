import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { Repository } from 'typeorm';
import { DeliverableSubmission } from '../entities/submission.entity';
import { DelivrableParams } from '../types/deliverables.types';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(DeliverableSubmission)
    private readonly submissionRepository: Repository<DeliverableSubmission>
  ) {}

  async submitDeliverable(params: DelivrableParams, file: Express.Multer.File): Promise<DeliverableSubmission> {
    try {
      const { deliverableId, participationId } = params;
      const existing = await this.findSubmission(deliverableId, participationId);
      if (!existing) {
        return await this.submissionRepository.save({
          file: file.filename,
          deliverable: { id: deliverableId },
          participation: { id: participationId }
        });
      }
      await fs.unlink(`./uploads/deliverables/${file.filename}`);
      return await this.submissionRepository.save({
        ...existing,
        file: file.filename
      });
    } catch {
      throw new BadRequestException('Soumission impossible');
    }
  }

  private async findSubmission(deliverableId: string, participationId: string): Promise<DeliverableSubmission | null> {
    return await this.submissionRepository.findOne({
      where: {
        deliverable: { id: deliverableId },
        participation: { id: participationId }
      }
    });
  }
}
