import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MentorRequestDto } from '../dto/mentor-request.dto';
import { UpdateMentorRequestDto } from '../dto/update-mentor-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorProfile } from '../entities/mentor.entity';
import { User } from '@/modules/users/entities/user.entity';
import { FilterMentorsInterface } from '../interfaces/filter-mentors.interface';
import { UsersService } from '@/modules/users/services/users.service';
import { MentorStatus } from '../enums/mentor.enum';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Role } from '@/modules/roles/enums/roles.enum';
import { CreateMentorDto } from '../dto/create-mentor.dto';
import { UpdateMentorDto } from '../dto/update-mentor.dto';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { Experience } from '../entities/experience.entity';
import { CreateExperienceDto } from '../dto/create-experience.dto';
import { promises as fs } from 'fs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MentorsService extends AbstractRepository<MentorProfile> {
  constructor(
    @InjectRepository(MentorProfile)
    repository: Repository<MentorProfile>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
    private readonly mailerService: MailerService
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
        await this.saveExperiences(mentorId, dto.experiences);
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
      await this.saveExperiences(mentorId, dto.mentor.experiences);
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
        await this.saveExperiences(id, dto.experiences);
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

  async uploadCv(id: string, file: Express.Multer.File): Promise<MentorProfile> {
    try {
      const mentor = await this.findOne(id);
      if (mentor.cv) {
        await fs.unlink(`./uploads/mentors/cvs/${mentor.cv}`).catch(() => undefined);
      }
      return await this.addCv(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout du CV impossible');
    }
  }

  async saveExperiences(mentorProfileId: string, dto: CreateExperienceDto[]): Promise<Experience[]> {
    try {
      const existingExperiences = await this.getExistingExperiences(mentorProfileId);
      const existingExperiencesMap = this.createExperienceMap(existingExperiences);
      const processedIds = new Set<string>();
      const result: Experience[] = [];
      for (const experienceDto of dto) {
        if (this.isExistingExperience(experienceDto, existingExperiencesMap)) {
          const updated = await this.updateExperience(experienceDto, existingExperiencesMap);
          result.push(updated);
          processedIds.add(experienceDto.id!);
        } else {
          const newExperience = await this.createExperience(experienceDto, mentorProfileId);
          result.push(newExperience);
        }
      }
      await this.deleteRemovedExperiences(existingExperiences, processedIds);
      return result;
    } catch {
      throw new BadRequestException('Sauvegarde des expériences impossible');
    }
  }

  @OnEvent('mentor.approved')
  async sendMentorApprovalEmail(mentorProfile: MentorProfile): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mentorProfile.owner.email,
        subject: 'Votre profil de mentor a été approuvé!',
        text: [
          `Bonjour ${mentorProfile.owner.name},`,
          '',
          'Votre profil de mentor a ete approuve.',
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('mentor.rejected')
  async sendMentorRejectionEmail(mentorProfile: MentorProfile): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mentorProfile.owner.email,
        subject: 'Décision concernant votre profil de mentor',
        text: [
          `Bonjour ${mentorProfile.owner.name},`,
          '',
          "Votre profil de mentor n'a pas ete approuve pour le moment.",
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('mentor.application')
  async sendMentorApplicationEmail(mentorProfile: MentorProfile): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mentorProfile.owner.email,
        subject: 'Candidature de mentor reçue',
        text: [
          `Bonjour ${mentorProfile.owner.name},`,
          '',
          'Votre candidature de mentor a bien ete recue et sera examinee.',
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
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
        await this.saveExperiences(mentorProfile.id, dto.experiences);
      }
      return await this.findOne(mentorProfile.id);
    } catch {
      throw new BadRequestException('Création du profil impossible');
    }
  }

  private async getExistingExperiences(mentorProfileId: string): Promise<Experience[]> {
    return await this.experienceRepository.find({
      where: { mentor_profile: { id: mentorProfileId } }
    });
  }

  private createExperienceMap(experiences: Experience[]): Map<string, Experience> {
    return new Map(experiences.map((experience) => [experience.id, experience]));
  }

  private isExistingExperience(dto: CreateExperienceDto, existingMap: Map<string, Experience>): boolean {
    return !!dto.id && existingMap.has(dto.id);
  }

  private async updateExperience(dto: CreateExperienceDto, existingMap: Map<string, Experience>): Promise<Experience> {
    const existing = existingMap.get(dto.id!);
    await this.experienceRepository.update(dto.id!, { ...existing, ...dto });
    return await this.experienceRepository.findOneByOrFail({ id: dto.id! });
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
    const idsToDelete = existingExperiences
      .filter((experience) => !processedIds.has(experience.id))
      .map((experience) => experience.id);
    if (idsToDelete.length > 0) {
      await this.experienceRepository.delete(idsToDelete);
    }
  }
}
