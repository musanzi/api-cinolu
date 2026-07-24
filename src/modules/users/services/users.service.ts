import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { RolesService } from '../../roles/services/roles.service';
import { FilterUsersInterface } from '../interfaces/filter-users.interface';
import { SignUpDto } from '@/modules/auth/dto/sign-up.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { parseUsersCsv } from '@/modules/users/helpers/user-csv.helper';
import { SignUpResult } from '../types/sign-up-result.type';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { MailerService } from '@nestjs-modules/mailer';
import { format } from 'fast-csv';
import { Response } from 'express';
import { promises as fs } from 'fs';

@Injectable()
export class UsersService extends AbstractRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
    private rolesService: RolesService,
    private eventEmitter: EventEmitter2,
    private mailerService: MailerService
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

  async saveReferralCode(user: User): Promise<User> {
    try {
      await this.repository.update(user.id, {
        referral_code: this.generateReferralCode()
      });
      return await this.findByEmail(user.email);
    } catch {
      throw new BadRequestException('Code de parrainage invalide');
    }
  }

  async referredUsers(page: number, user: User): Promise<[User[], number]> {
    try {
      const take = 20;
      const skip = (+page - 1) * take;
      return await this.repository
        .createQueryBuilder('u')
        .loadRelationCountAndMap('u.referralsCount', 'u.referrals')
        .where('u.referred_by.id = :id', { id: user.id })
        .orderBy('u.created_at', 'DESC')
        .skip(skip)
        .take(take)
        .getManyAndCount();
    } catch {
      throw new BadRequestException('Filleuls introuvables');
    }
  }

  async findAmbassadors(): Promise<[User[], number]> {
    const query = this.repository.createQueryBuilder('u').loadRelationCountAndMap('u.referralsCount', 'u.referrals');
    const users = await query.getMany();
    const filteredUsers = users.filter((user) => Number(user['referralsCount']) > 0);
    return [filteredUsers, filteredUsers.length];
  }

  async findAmbassadorByEmail(email: string): Promise<User> {
    try {
      return await this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.ventures', 'ventures')
        .loadRelationCountAndMap('user.referralsCount', 'user.referrals')
        .leftJoinAndSelect('ventures.gallery', 'gallery')
        .leftJoinAndSelect('ventures.products', 'products')
        .leftJoinAndSelect('products.gallery', 'productsGallery')
        .where('user.email = :email', { email })
        .getOneOrFail();
    } catch {
      throw new NotFoundException('Ambassadeur introuvable');
    }
  }

  async exportCSV(queryParams: FilterUsersInterface, res: Response): Promise<void> {
    try {
      const { q } = queryParams;
      const query = this.repository
        .createQueryBuilder('user')
        .select(['user.name', 'user.email', 'user.phone_number'])
        .orderBy('user.updated_at', 'DESC');
      if (q) {
        query.where('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      }
      const users = await query.getMany();
      const csvStream = format({ headers: ['Name', 'Email', 'Phone Number'] });
      csvStream.pipe(res);
      users.forEach((user) => {
        csvStream.write({ Name: user.name, Email: user.email, 'Phone Number': user.phone_number });
      });
      csvStream.end();
    } catch {
      throw new BadRequestException('Export des utilisateurs impossible');
    }
  }

  async uploadImage(currentUser: User, file: Express.Multer.File): Promise<User> {
    try {
      if (currentUser.profile) await fs.unlink(`./uploads/profiles/${currentUser.profile}`);
      await this.update(currentUser.id, { profile: file.filename });
      return this.findByEmail(currentUser.email);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  @OnEvent('user.referral-signup')
  async sendReferralSignupEmail(payload: { referredBy: User; newUser: User }): Promise<void> {
    try {
      const { referredBy, newUser } = payload;
      await this.mailerService.sendMail({
        to: referredBy.email,
        subject: 'Un nouvel utilisateur a rejoint CINOLU grâce à votre lien de parrainage',
        text: [
          `Bonjour ${referredBy.name},`,
          '',
          `${newUser.name} (${newUser.email}) a rejoint CINOLU grace a votre lien de parrainage.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
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
