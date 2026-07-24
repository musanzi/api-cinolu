import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliverableDto } from '../dto/deliverable.dto';
import { Deliverable } from '../entities/deliverable.entity';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { DeliverableSubmission } from '../entities/submission.entity';
import { DelivrableParams } from '../types/deliverables.types';
import { promises as fs } from 'fs';

@Injectable()
export class DeliverablesService extends AbstractRepository<Deliverable> {
  constructor(
    @InjectRepository(Deliverable)
    repository: Repository<Deliverable>,
    @InjectRepository(DeliverableSubmission)
    private readonly submissionRepository: Repository<DeliverableSubmission>
  ) {
    super(repository);
  }

  async create(phaseId: string, dto: DeliverableDto[]): Promise<Deliverable[]> {
    if (!dto?.length) return;
    try {
      const payload = dto.map((dto) => ({
        title: dto.title,
        description: dto.description,
        phase: { id: phaseId }
      }));
      return await this.repository.save(payload);
    } catch {
      throw new BadRequestException('Création des livrables impossible');
    }
  }

  async sync(phaseId: string, dto: DeliverableDto[]): Promise<void> {
    if (!dto?.length) return;
    try {
      const current = await this.findByPhase(phaseId);
      const currentById = this.mapById(current);
      const incomingWithId = this.getWithId(dto);
      this.ensureIdsExist(incomingWithId, currentById);
      await this.update(incomingWithId, currentById);
      await this.remove(current, incomingWithId);
      await this.addNew(phaseId, dto);
    } catch {
      throw new BadRequestException('Synchronisation impossible');
    }
  }

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
      await this.submissionRepository.update(existing.id, { file: file.filename });
      return await this.submissionRepository.findOneByOrFail({ id: existing.id });
    } catch {
      throw new BadRequestException('Soumission impossible');
    }
  }

  private async findByPhase(phaseId: string): Promise<Deliverable[]> {
    return await this.findEntities({
      where: { phase: { id: phaseId } }
    });
  }

  private mapById(deliverables: Deliverable[]): Map<string, Deliverable> {
    return new Map(deliverables.map((deliverable) => [deliverable.id, deliverable]));
  }

  private getWithId(incoming: DeliverableDto[]): DeliverableDto[] {
    return incoming.filter((dto) => dto.id);
  }

  private ensureIdsExist(dto: DeliverableDto[], currentById: Map<string, Deliverable>): void {
    const hasInvalidId = dto.some((dto) => !currentById.has(dto.id as string));
    if (hasInvalidId) throw new BadRequestException('Livrable introuvable');
  }

  private async update(dto: DeliverableDto[], currentById: Map<string, Deliverable>): Promise<void> {
    for (const d of dto) {
      const existing = currentById.get(d.id as string);
      if (!existing) continue;
      if (!this.hasChanges(existing, d)) continue;
      await this.repository.save(this.buildUpdated(existing, d));
    }
  }

  private hasChanges(existing: Deliverable, dto: DeliverableDto): boolean {
    return existing.title !== dto.title || (existing.description ?? null) !== (dto.description ?? null);
  }

  private buildUpdated(existing: Deliverable, dto: DeliverableDto): Deliverable {
    return {
      ...existing,
      title: dto.title,
      description: dto.description
    };
  }

  private async remove(current: Deliverable[], dto: DeliverableDto[]): Promise<void> {
    const ids = new Set(dto.map((dto) => dto.id as string));
    const toDeleteIds = current.filter((deliverable) => !ids.has(deliverable.id)).map((deliverable) => deliverable.id);
    if (!toDeleteIds.length) return;
    await this.repository.softDelete(toDeleteIds);
  }

  private async addNew(phaseId: string, dto: DeliverableDto[]): Promise<void> {
    const toCreate = dto.filter((d) => !d.id);
    if (!toCreate.length) return;
    await this.create(phaseId, toCreate);
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
