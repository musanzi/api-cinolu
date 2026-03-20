import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/services/users.service';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class AuthPasswordService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

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
}
