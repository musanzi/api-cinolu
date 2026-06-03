import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MentorRequestDto } from '../dto/mentor-request.dto';
import { UpdateMentorRequestDto } from '../dto/update-mentor-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorProfile } from '../entities/mentor.entity';
import { User } from '../../../identity/users/entities/user.entity';
import { FilterMentorsInterface } from '../interfaces/filter-mentors.interface';
import { UsersService } from '../../../identity/users/services/users.service';
import { MentorStatus } from '../enums/mentor.enum';
import { MentorExperiencesService } from './mentor-experiences.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '../../../identity/roles/enums/roles.enum';
import { CreateMentorDto } from '../dto/create-mentor.dto';
import { UpdateMentorDto } from '../dto/update-mentor.dto';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class MentorsService extends AbstractRepository<MentorProfile> {
  constructor(
    @InjectRepository(MentorProfile)
    repository: Repository<MentorProfile>,
    private usersService: UsersService,
    private experiencesService: MentorExperiencesService,
    private eventEmitter: EventEmitter2
  ) {
    super(repository);
  }

  async submitRequest(userId: string, dto: MentorRequestDto): Promise<MentorProfile> {
    try {
      const savedProfile = await this.createProfile(userId, dto, MentorStatus.PENDING);
      this.eventEmitter.emit('mentor.application', savedProfile);
      return savedProfile;
    } catch {
      throw new BadRequestException('Création du profil impossible');
    }
  }

  async updateRequest(mentorId: string, dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    try {
      if (dto.experiences) {
        await this.experiencesService.saveExperiences(mentorId, dto.experiences);
      }
      return await this.updateEntity(mentorId, {
        ...dto,
        expertises: dto.experiences ? dto?.expertises?.map((id) => ({ id })) : null
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async findMentorsByPhase(phaseId: string): Promise<MentorProfile[]> {
    return await this.findEntities({
      where: { phases: { id: phaseId } },
      relations: ['owner']
    });
  }

  async findUsersByPhase(phaseId: string): Promise<User[]> {
    const mentors = await this.findMentorsByPhase(phaseId);
    return this.extractUniqueUsers(mentors);
  }

  private extractUniqueUsers(mentors: MentorProfile[]): User[] {
    const uniqueUsers = new Map<string, User>();
    mentors.forEach((mentor) => {
      if (mentor.owner && !uniqueUsers.has(mentor.owner.id)) {
        uniqueUsers.set(mentor.owner.id, mentor.owner);
      }
    });
    return Array.from(uniqueUsers.values());
  }

  async create(dto: CreateMentorDto): Promise<MentorProfile> {
    try {
      const user = await this.usersService.findByEmail(dto.email);
      await this.usersService.assignRole(user.id, Role.MENTOR);
      return await this.createProfile(user.id, dto.mentor, MentorStatus.APPROVED);
    } catch {
      throw new BadRequestException('Création du profil impossible');
    }
  }

  async updateMentor(mentorId: string, dto: UpdateMentorDto): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(mentorId);
      await this.experiencesService.saveExperiences(mentorId, dto.mentor.experiences);
      await this.usersService.update(mentorProfile.owner.id, dto.user);
      await this.updateEntity(mentorId, {
        ...dto.mentor,
        expertises: dto.mentor.expertises ? dto.mentor.expertises.map((id) => ({ id })) : null
      });
      return await this.findOne(mentorId);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async findFiltered(dto: FilterMentorsInterface): Promise<[MentorProfile[], number]> {
    try {
      const { q, page, status } = dto;
      const query = this.repository
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.owner', 'owner')
        .leftJoinAndSelect('m.expertises', 'expertises');
      if (q) query.andWhere('owner.name LIKE :search', { search: `%${q}%` });
      if (status) query.andWhere('m.status = :status', { status });
      if (page) query.skip((+page - 1) * 10).take(10);
      return await query.getManyAndCount();
    } catch {
      throw new BadRequestException('Mentors introuvables');
    }
  }

  async findApproved(): Promise<MentorProfile[]> {
    return await this.findEntities({
      where: { status: MentorStatus.APPROVED },
      relations: ['owner', 'experiences', 'expertises']
    });
  }

  async approve(id: string): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(id);
      await this.updateEntity(id, { status: MentorStatus.APPROVED });
      await this.usersService.assignRole(mentorProfile.owner.id, Role.MENTOR);
      this.eventEmitter.emit('mentor.approved', mentorProfile);
      return await this.findOne(id);
    } catch {
      throw new BadRequestException('Approbation impossible');
    }
  }

  async reject(id: string): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(id);
      await this.updateEntity(id, { status: MentorStatus.REJECTED });
      await this.usersService.assignRole(mentorProfile.owner.id, Role.USER);
      const updatedProfile = await this.findOne(id);
      this.eventEmitter.emit('mentor.rejected', updatedProfile);
      return updatedProfile;
    } catch {
      throw new BadRequestException('Rejet impossible');
    }
  }

  async findByUser(userId: string): Promise<MentorProfile[]> {
    try {
      return await this.findEntities({
        where: { owner: { id: userId } },
        relations: ['experiences', 'expertises']
      });
    } catch {
      throw new NotFoundException('Mentors introuvables');
    }
  }

  async findOne(id: string): Promise<MentorProfile> {
    return await this.findEntity({ where: { id }, relations: ['experiences', 'expertises', 'owner'] });
  }

  async update(id: string, dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    try {
      if (dto.experiences) {
        await this.experiencesService.saveExperiences(id, dto.experiences);
      }
      return await this.updateEntity(id, {
        ...dto,
        expertises: dto.experiences ? dto.expertises.map((id) => ({ id })) : null
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async addCv(id: string, cv: string): Promise<MentorProfile> {
    return await this.updateEntity(id, { cv });
  }

  private async createProfile(userId: string, dto: MentorRequestDto, status: MentorStatus): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.createEntity({
        ...dto,
        status,
        owner: { id: userId },
        expertises: dto.expertises ? dto.expertises.map((id) => ({ id })) : []
      });
      if (dto.experiences?.length) {
        await this.experiencesService.saveExperiences(mentorProfile.id, dto.experiences);
      }
      return await this.findOne(mentorProfile.id);
    } catch {
      throw new BadRequestException('Création du profil impossible');
    }
  }
}
