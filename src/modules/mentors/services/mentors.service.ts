import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MentorRequestDto } from '../dto/mentor-request.dto';
import { UpdateMentorRequestDto } from '../dto/update-mentor-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorProfile } from '../entities/mentor.entity';
import { User } from '../../users/entities/user.entity';
import { FilterMentorsDto } from '../dto/filter-mentors.dto';
import { UsersService } from '../../users/services/users.service';
import { MentorStatus } from '../enums/mentor.enum';
import { MentorExperiencesService } from './mentor-experiences.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@/core/auth/enums/roles.enum';
import { CreateMentorDto } from '../dto/create-mentor.dto';
import { UpdateMentorDto } from '../dto/update-mentor.dto';

@Injectable()
export class MentorsService {
  constructor(
    @InjectRepository(MentorProfile)
    private mentorRepository: Repository<MentorProfile>,
    private usersService: UsersService,
    private experiencesService: MentorExperiencesService,
    private eventEmitter: EventEmitter2
  ) {}

  async submitRequest(user: User, dto: MentorRequestDto): Promise<MentorProfile> {
    try {
      const savedProfile = await this.createProfile(user.id, dto, MentorStatus.PENDING);
      this.eventEmitter.emit('mentor.application', savedProfile);
      return savedProfile;
    } catch {
      throw new BadRequestException('Création du profil impossible');
    }
  }

  async updateRequest(mentorId: string, dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(mentorId);
      if (dto.experiences) {
        await this.experiencesService.saveExperiences(mentorId, dto.experiences);
      }
      await this.mentorRepository.save({
        ...mentorProfile,
        ...dto,
        expertises: dto?.expertises?.map((id) => ({ id })) || mentorProfile.expertises
      });
      return await this.findOne(mentorId);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async findMentorsByPhase(phaseId: string): Promise<MentorProfile[]> {
    return await this.mentorRepository.find({
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
      await this.mentorRepository.save({
        ...mentorProfile,
        ...dto.mentor,
        expertises: dto.mentor.expertises?.map((id) => ({ id })) || mentorProfile.expertises
      });
      return await this.findOne(mentorId);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async findFiltered(dto: FilterMentorsDto): Promise<[MentorProfile[], number]> {
    try {
      const { q, page, status } = dto;
      const query = this.mentorRepository
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
    try {
      return await this.mentorRepository.find({
        where: { status: MentorStatus.APPROVED },
        relations: ['owner', 'experiences', 'expertises']
      });
    } catch {
      throw new NotFoundException('Mentors introuvables');
    }
  }

  async approve(id: string): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(id);
      await this.mentorRepository.update(id, { status: MentorStatus.APPROVED });
      await this.usersService.assignRole(mentorProfile.owner.id, Role.MENTOR);
      this.eventEmitter.emit('mentor.approved', mentorProfile);
      return await this.findOne(id);
    } catch {
      throw new BadRequestException("Approbation impossible");
    }
  }

  async reject(id: string): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(id);
      await this.mentorRepository.update(id, { status: MentorStatus.REJECTED });
      await this.usersService.assignRole(mentorProfile.owner.id, Role.USER);
      const updatedProfile = await this.findOne(id);
      this.eventEmitter.emit('mentor.rejected', updatedProfile);
      return updatedProfile;
    } catch {
      throw new BadRequestException('Rejet impossible');
    }
  }

  async findByUser(user: User): Promise<MentorProfile[]> {
    try {
      return await this.mentorRepository.find({
        where: { owner: { id: user.id } },
        relations: ['experiences', 'expertises']
      });
    } catch {
      throw new NotFoundException('Mentors introuvables');
    }
  }

  async findOne(id: string): Promise<MentorProfile> {
    try {
      return await this.mentorRepository.findOneOrFail({
        where: { id },
        relations: ['experiences', 'expertises', 'owner']
      });
    } catch {
      throw new NotFoundException('Mentor introuvable');
    }
  }

  async update(id: string, dto: UpdateMentorRequestDto): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.findOne(id);
      if (dto.experiences) {
        await this.experiencesService.saveExperiences(id, dto.experiences);
      }
      return await this.mentorRepository.save({
        ...mentorProfile,
        ...dto,
        expertises: dto?.expertises?.map((id) => ({ id })) || mentorProfile.expertises
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.mentorRepository.softDelete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }

  async addCv(id: string, cv: string): Promise<MentorProfile> {
    try {
      const mentor = await this.findOne(id);
      mentor.cv = cv;
      return await this.mentorRepository.save(mentor);
    } catch {
      throw new BadRequestException('Ajout du CV impossible');
    }
  }

  private async createProfile(userId: string, dto: MentorRequestDto, status: MentorStatus): Promise<MentorProfile> {
    try {
      const mentorProfile = await this.mentorRepository.save({
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
