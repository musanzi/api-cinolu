import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/services/users.service';
import { SignUpResult } from '@/modules/users/types/sign-up-result.type';
import { SignUpDto } from '../dto/sign-up.dto';
import { ContactSupportDto } from '../dto/contact-support.dto';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { compare } from 'bcryptjs';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.password) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    return await this.usersService.findByEmail(user.email);
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
    return req['user'] as User;
  }

  async signUp(dto: SignUpDto): Promise<User> {
    try {
      const { user, isNew }: SignUpResult = await this.usersService.signUp(dto);
      if (isNew) this.eventEmitter.emit('user.welcome', user);
      return user;
    } catch (error) {
      throw new BadRequestException(error['message']);
    }
  }

  signOut(req: Request): void {
    req.session.destroy(() => {});
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

  async updatePassword(currentUser: User, dto: UpdatePasswordDto): Promise<User> {
    try {
      await this.usersService.update(currentUser.id, { password: dto.password });
      return await this.usersService.findByEmail(currentUser.email);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(dto.email);
      const token = await this.generateToken(user, '15m');
      const frontendUri = this.configService.get<string>('FRONTEND_URI');
      const link = `${frontendUri}/reset-password?token=${token}`;
      this.eventEmitter.emit('user.reset-password', { user, link });
    } catch {
      throw new BadRequestException('Demande invalide');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<User> {
    const { token, password } = resetPasswordDto;
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.usersService.update(payload.sub, { password });
    } catch {
      throw new BadRequestException('Mot de passe invalide');
    }
  }

  private async generateToken(user: User, expiresIn: number | string = '1d'): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET');
    const payload = { sub: user.id, name: user.name, email: user.email };
    const options: Record<string, unknown> = { secret };
    options['expiresIn'] = expiresIn;
    return this.jwtService.signAsync(payload, options);
  }

  async contactUs(dto: ContactSupportDto): Promise<void> {
    try {
      this.eventEmitter.emit('contact.support', dto);
    } catch {
      throw new BadRequestException('Envoi du message impossible');
    }
  }

  @OnEvent('user.welcome')
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Bienvenue sur CINOLU',
        text: [`Bonjour ${user.name},`, '', 'Bienvenue sur CINOLU.', '', "L'equipe CINOLU"].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('user.reset-password')
  async resetEmail(payload: { user: User; link: string }): Promise<void> {
    try {
      const { user, link } = payload;
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Réinitialisation du mot de passe',
        text: [
          `Bonjour ${user.name},`,
          '',
          'Vous avez demande la reinitialisation de votre mot de passe.',
          `Lien: ${link}`,
          '',
          "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('contact.support')
  async contactSupport(dto: ContactSupportDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: process.env.SUPPORT_EMAIL,
        subject: `One Stop Contact from ${dto.name}`,
        text: [
          'New support contact request',
          '',
          `Name: ${dto.name}`,
          `Email: ${dto.email}`,
          `Country: ${dto.country}`,
          `Phone: ${dto.phone_number}`,
          '',
          'Message:',
          dto.message
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
