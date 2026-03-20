import { Experience } from '../entities/experience.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateExperienceDto } from '../dto/create-experience.dto';

@Injectable()
export class MentorExperiencesService {
  constructor(
    @InjectRepository(Experience)
    private experienceRepository: Repository<Experience>
  ) {}

  async saveExperiences(mentorProfileId: string, dto: CreateExperienceDto[]): Promise<Experience[]> {
    try {
      const existingExperiences = await this.getExistingExperiences(mentorProfileId);
      const existingExperiencesMap = this.createExperienceMap(existingExperiences);
      const processedIds = new Set<string>();
      const result: Experience[] = [];
      for (const d of dto) {
        if (this.isExistingExperience(d, existingExperiencesMap)) {
          const updated = await this.updateExperience(d, existingExperiencesMap);
          result.push(updated);
          processedIds.add(d.id!);
        } else {
          const newExperience = await this.createExperience(d, mentorProfileId);
          result.push(newExperience);
        }
      }
      await this.deleteRemovedExperiences(existingExperiences, processedIds);
      return result;
    } catch {
      throw new BadRequestException('Sauvegarde des expériences impossible');
    }
  }

  private async getExistingExperiences(mentorProfileId: string): Promise<Experience[]> {
    return await this.experienceRepository.find({
      where: { mentor_profile: { id: mentorProfileId } }
    });
  }

  private createExperienceMap(experiences: Experience[]): Map<string, Experience> {
    return new Map(experiences.map((exp) => [exp.id, exp]));
  }

  private isExistingExperience(dto: CreateExperienceDto, existingMap: Map<string, Experience>): boolean {
    return !!dto.id && existingMap.has(dto.id);
  }

  private async updateExperience(dto: CreateExperienceDto, existingMap: Map<string, Experience>): Promise<Experience> {
    const existing = existingMap.get(dto.id!);
    return await this.experienceRepository.save({
      ...existing,
      ...dto
    });
  }

  private async createExperience(dto: CreateExperienceDto, mentorProfileId: string): Promise<Experience> {
    return await this.experienceRepository.save({
      ...dto,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
      mentor_profile: { id: mentorProfileId }
    });
  }

  private async deleteRemovedExperiences(existingExperiences: Experience[], processedIds: Set<string>): Promise<void> {
    const idsToDelete = existingExperiences.filter((exp) => !processedIds.has(exp.id)).map((exp) => exp.id);
    if (idsToDelete.length > 0) {
      await this.experienceRepository.delete(idsToDelete);
    }
  }
}
