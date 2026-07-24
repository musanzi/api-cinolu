import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

@Injectable()
export class UserMediaService {
  constructor(private readonly usersService: UsersService) {}

  async uploadImage(currentUser: User, file: Express.Multer.File): Promise<User> {
    try {
      if (currentUser.profile) await fs.unlink(`./uploads/profiles/${currentUser.profile}`);
      await this.usersService.update(currentUser.id, { profile: file.filename });
      return this.usersService.findByEmail(currentUser.email);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }
}
