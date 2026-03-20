import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/services/users.service';
import { SignUpDto } from '../dto/sign-up.dto';
import { ContactSupportDto } from '../dto/contact-support.dto';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    return user;
  }

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    try {
      return await this.usersService.findOrCreate(dto);
    } catch {
      throw new BadRequestException('Requête invalide');
    }
  }

  async signInWithGoogle(res: Response): Promise<void> {
    const frontendUri = this.configService.get<string>('FRONTEND_URI');
    return res.redirect(frontendUri);
  }

  async signIn(req: Request): Promise<User> {
    if (!req.user) {
      throw new UnauthorizedException('Non autorisé');
    }
    return req.user as User;
  }

  async signUp(dto: SignUpDto): Promise<User> {
    try {
      const user = await this.usersService.signUp(dto);
      this.eventEmitter.emit('user.welcome', user);
      return user;
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  signOut(request: Request): void {
    request.session.destroy(() => {});
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.usersService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Non autorisé');
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword || '');
  }

  async profile(user: User): Promise<User> {
    return this.usersService.findByEmail(user.email);
  }

  async updateProfile(user: User, dto: UpdateUserDto): Promise<User> {
    try {
      return await this.usersService.update(user.id, dto);
    } catch {
      throw new BadRequestException('Requête invalide');
    }
  }

  async contactUs(dto: ContactSupportDto): Promise<void> {
    try {
      this.eventEmitter.emit('contact.support', dto);
    } catch {
      throw new BadRequestException('Envoi du message impossible');
    }
  }
}
