import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCoach } from '../entities/ai-coach.entity';
import { Venture } from '@/modules/ventures/entities/venture.entity';

type CreateCoachInput = {
  name: string;
  profile: string;
  role: string;
  expectedOutputs: string[];
  ventureId: string;
};

@Injectable()
export class CoachStoreService {
  constructor(
    @InjectRepository(AiCoach)
    private readonly coachRepository: Repository<AiCoach>
  ) {}

  async findByVenture(ventureId: string): Promise<AiCoach | null> {
    try {
      return await this.coachRepository.findOne({
        where: { venture: { id: ventureId } },
        relations: ['venture']
      });
    } catch {
      throw new BadRequestException('Coach introuvable');
    }
  }

  async findByVentureOrFail(ventureId: string): Promise<AiCoach> {
    try {
      return await this.coachRepository.findOneOrFail({
        where: { venture: { id: ventureId } },
        relations: ['venture']
      });
    } catch {
      throw new NotFoundException('Coach introuvable');
    }
  }

  async create(input: CreateCoachInput): Promise<AiCoach> {
    try {
      return await this.coachRepository.save({
        name: input.name,
        profile: input.profile,
        role: input.role,
        expected_outputs: input.expectedOutputs,
        model: 'llama3.2:3b',
        venture: { id: input.ventureId } as Venture
      });
    } catch {
      throw new BadRequestException('Création du coach impossible');
    }
  }
}
