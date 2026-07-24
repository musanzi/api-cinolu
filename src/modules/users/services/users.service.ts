import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { RolesService } from '../../roles/services/roles.service';
import { FilterUsersInterface } from '../interfaces/filter-users.interface';
import { SignUpDto } from '@/modules/auth/dto/sign-up.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { parseUsersCsv } from '@/modules/users/helpers/user-csv.helper';
import { SignUpResult } from '../types/sign-up-result.type';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { ProjectParticipationReview } from '@/modules/projects/projects/entities/project-participation-review.entity';
import { ProjectParticipation } from '@/modules/projects/projects/entities/project-participation.entity';
import { ProjectParticipationUpvote } from '@/modules/projects/projects/entities/participation-upvote.entity';
import { DeliverableSubmission } from '@/modules/projects/phases/deliverables/entities/submission.entity';
import { EventParticipation } from '@/modules/events/events/entities/event-participation.entity';

@Injectable()
export class UsersService extends AbstractRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
    private rolesService: RolesService,
    private eventEmitter: EventEmitter2
  ) {
    super(repository);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return await this.findEntities({ where: { id: In(ids) } });
  }

  async findStaff(): Promise<User[]> {
    try {
      const role = await this.rolesService.findByName('staff');
      return await this.findEntities({
        where: { roles: { id: role.id } },
        relations: ['roles']
      });
    } catch {
      throw new BadRequestException('Personnel introuvable');
    }
  }

  async assignRole(userId: string, roleName: string): Promise<User> {
    try {
      const role = await this.rolesService.findByName(roleName);
      const user = await this.findOne(userId);
      user.roles = [role];
      return await this.updateEntity(user.id, { roles: [role] });
    } catch {
      throw new BadRequestException('Attribution du rôle impossible');
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.createEntity({
        ...dto,
        password: 'user1234',
        referral_code: this.generateReferralCode(),
        roles: dto.roles?.map((id) => ({ id }))
      });
    } catch {
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  async findEntrepreneurs(): Promise<User[]> {
    try {
      const query = this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.ventures', 'ventures')
        .where('ventures.id IS NOT NULL');
      return await query.getMany();
    } catch {
      throw new BadRequestException('Entrepreneurs introuvables');
    }
  }

  private generateReferralCode(): string {
    return randomBytes(9).toString('base64url');
  }

  async findAll(queryParams: FilterUsersInterface): Promise<[User[], number]> {
    try {
      const { page, q } = queryParams;
      const query = this.repository.createQueryBuilder('u').loadRelationCountAndMap('u.referralsCount', 'u.referrals');
      if (q) query.where('u.name LIKE :q OR u.email LIKE :q', { q: `%${q}%` });
      return await this.findPaginatedEntities(query, { page, take: 50 });
    } catch {
      throw new BadRequestException('Utilisateurs introuvables');
    }
  }

  async search(q: string): Promise<User[]> {
    try {
      const searchTerm = `%${q.trim()}%`;
      return await this.repository
        .createQueryBuilder('u')
        .where('u.name LIKE :q OR u.email LIKE :q', { q: searchTerm })
        .take(20)
        .getMany();
    } catch {
      throw new BadRequestException('Recherche impossible');
    }
  }

  async referredBy(referral_code: string): Promise<User> {
    try {
      return await this.repository.findOne({ where: { referral_code } });
    } catch {
      throw new BadRequestException('Parrain introuvable');
    }
  }

  async signUp(dto: SignUpDto): Promise<SignUpResult> {
    try {
      const existingUser = await this.findSignUpUser(dto.email);
      if (existingUser) {
        const user = await this.update(existingUser.id, { password: dto.password });
        return { user, isNew: false };
      }
      const user = await this.createSignUpUser(dto);
      return { user, isNew: true };
    } catch {
      throw new BadRequestException('Cet utilisateur existe déjà');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.findEntity({
        where: { id },
        relations: ['roles', 'mentor_profile']
      });
      return this.mapUserRoles(user);
    } catch {
      throw new BadRequestException('Utilisateur introuvable');
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.findEntity({
        where: { email },
        relations: ['roles', 'mentor_profile']
      });
      user['referralsCount'] = await this.repository.count({
        where: { referred_by: { id: user.id } }
      });
      return this.mapUserRoles(user);
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async findByEmailWithPassword(email: string): Promise<User> {
    try {
      const user = await this.repository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('user.mentor_profile', 'mentor_profile')
        .where('user.email = :email', { email })
        .getOneOrFail();
      user['referralsCount'] = await this.repository.count({
        where: { referred_by: { id: user.id } }
      });
      return this.mapUserRoles(user);
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.findEntity({ where: { email }, relations: ['roles'] });
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    try {
      const user = await this.repository.findOne({
        where: { email: dto.email },
        relations: ['roles']
      });
      if (user) {
        const newUser = await this.update(user.id, dto);
        return await this.findOne(newUser.id);
      }
      const role = await this.rolesService.findByName('user');
      const newUser = await this.repository.save({
        ...dto,
        referral_code: this.generateReferralCode(),
        roles: [role]
      });
      return await this.findOne(newUser.id);
    } catch {
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  async importCsv(file: Express.Multer.File): Promise<void> {
    try {
      const rows = await parseUsersCsv(file.buffer);
      for (const row of rows) {
        await this.findOrCreate(row);
      }
    } catch {
      throw new BadRequestException('Import des utilisateurs impossible');
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    try {
      return await this.updateEntity(id, {
        ...dto,
        roles: dto.roles ? dto.roles.map((id) => ({ id })) : null
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async clear(): Promise<number> {
    try {
      return await this.repository.manager.transaction(async (manager) => {
        const users = await manager
          .getRepository(User)
          .createQueryBuilder('user')
          .select(['user.id'])
          .leftJoinAndSelect('user.roles', 'role')
          .leftJoin('user.referrals', 'referral')
          .leftJoin('user.ventures', 'venture')
          .leftJoin('user.project_participation_upvotes', 'projectParticipationUpvote')
          .leftJoin('user.managed_projects', 'managedProject')
          .leftJoin('user.managed_events', 'managedEvent')
          .leftJoin('user.articles', 'article')
          .leftJoin('user.comments', 'comment')
          .leftJoin('user.mentor_profile', 'mentorProfile')
          .leftJoin('user.sent_notifications', 'notification')
          .leftJoin(
            ProjectParticipationReview,
            'projectParticipationReview',
            'projectParticipationReview.reviewer = user.id'
          )
          .where("(user.profile IS NULL OR TRIM(user.profile) = '')")
          .andWhere("(user.google_image IS NULL OR TRIM(user.google_image) = '')")
          .andWhere('referral.id IS NULL')
          .andWhere('venture.id IS NULL')
          .andWhere('projectParticipationUpvote.id IS NULL')
          .andWhere('managedProject.id IS NULL')
          .andWhere('managedEvent.id IS NULL')
          .andWhere('article.id IS NULL')
          .andWhere('comment.id IS NULL')
          .andWhere('mentorProfile.id IS NULL')
          .andWhere('notification.id IS NULL')
          .andWhere('projectParticipationReview.id IS NULL')
          .setLock('pessimistic_write')
          .getMany();

        if (!users.length) return 0;

        const idsToDelete = users.map((user) => user.id);
        await this.deleteParticipationRelationships(manager, idsToDelete);

        for (const user of users) {
          if (!user.roles.length) continue;
          await manager
            .createQueryBuilder()
            .relation(User, 'roles')
            .of(user.id)
            .remove(user.roles.map((role) => role.id));
        }

        await manager.delete(User, idsToDelete);
        return idsToDelete.length;
      });
    } catch {
      throw new BadRequestException('Nettoyage impossible');
    }
  }

  private async deleteParticipationRelationships(manager: EntityManager, userIds: string[]): Promise<void> {
    const projectParticipations = await manager.getRepository(ProjectParticipation).find({
      select: ['id'],
      where: { user: { id: In(userIds) } },
      withDeleted: true
    });
    const projectParticipationIds = projectParticipations.map((participation) => participation.id);

    if (projectParticipationIds.length) {
      const participationCriteria = { participation: { id: In(projectParticipationIds) } };
      await manager.delete(DeliverableSubmission, participationCriteria);
      await manager.delete(ProjectParticipationUpvote, participationCriteria);
      await manager.delete(ProjectParticipationReview, participationCriteria);
      await manager.delete(ProjectParticipation, projectParticipationIds);
    }

    await manager.delete(EventParticipation, { user: { id: In(userIds) } });
  }

  private mapUserRoles(user: User): User {
    const roles = user.roles.map((role) => role.name);
    return { ...user, roles } as unknown as User;
  }

  private async findSignUpUser(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
      relations: ['roles']
    });
  }

  private async createSignUpUser(dto: SignUpDto): Promise<User> {
    const role = await this.rolesService.findByName('user');
    const referredBy = await this.findReferredUser(dto.referral_code);
    const newUser = await this.repository.save({
      email: dto.email,
      password: dto.password,
      referred_by: referredBy ? { id: referredBy.id } : null,
      referral_code: this.generateReferralCode(),
      roles: [{ id: role.id }]
    });
    if (referredBy) {
      this.eventEmitter.emit('user.referral-signup', { referredBy, newUser });
    }
    return await this.findByEmail(newUser.email);
  }

  private async findReferredUser(referralCode?: string): Promise<User | null> {
    if (!referralCode) return null;
    return await this.referredBy(referralCode);
  }
}
