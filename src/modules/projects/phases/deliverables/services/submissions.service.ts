import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { Repository } from 'typeorm';
import { DeliverableSubmission } from '../entities/submission.entity';
import { DelivrableParams } from '../types/deliverables.types';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';

@Injectable()
export class SubmissionsService extends AbstractRepository<DeliverableSubmission> {
  constructor(
    @InjectRepository(DeliverableSubmission)
    repository: Repository<DeliverableSubmission>
  ) {
    super(repository);
  }

  async submitDeliverable(params: DelivrableParams, file: Express.Multer.File): Promise<DeliverableSubmission> {
    try {
      const { deliverableId, participationId } = params;
      const existing = await this.findSubmission(deliverableId, participationId);
      if (!existing) {
        return await this.createEntity({
          file: file.filename,
          deliverable: { id: deliverableId },
          participation: { id: participationId }
        });
      }
      await fs.unlink(`./uploads/deliverables/${file.filename}`);
      return await this.updateEntity(existing.id, { file: file.filename });
    } catch {
      throw new BadRequestException('Soumission impossible');
    }
  }

  private async findSubmission(deliverableId: string, participationId: string): Promise<DeliverableSubmission | null> {
    return await this.repository.findOne({
      where: {
        deliverable: { id: deliverableId },
        participation: { id: participationId }
      }
    });
  }
}
