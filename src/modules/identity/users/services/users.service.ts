import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { RolesService } from '../../roles/services/roles.service';
import { FilterUsersInterface } from '../interfaces/filter-users.interface';
import { SignUpDto } from '../../../auth/dto/sign-up.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { parseUsersCsv } from '@/modules/identity/users/helpers/user-csv.helper';
import { SignUpResult } from '../types/sign-up-result.type';
import { AbstractRepository } from '@/modules/database/abstract.repository';

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
    } catch (e) {
      console.log(e);
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
      if (user) return await this.update(user.id, dto);
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
      const users = await this.findEntities({
        select: ['id', 'email', 'name']
      });
      const idsToDelete = users
        .filter((user) => !this.isValidEmail(user.email) || !this.isValidName(user.name))
        .map((user) => user.id);
      if (!idsToDelete.length) return 0;
      await this.repository.delete(idsToDelete);
      return idsToDelete.length;
    } catch {
      throw new BadRequestException('Nettoyage impossible');
    }
  }

  private isValidEmail(email: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isValidName(name: string): boolean {
    if (!name) return false;
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.includes('@')) return false;
    return /[A-Za-z]/.test(normalizedName);
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
