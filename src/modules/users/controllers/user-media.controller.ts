import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { User } from '../entities/user.entity';
import { UserMediaService } from '../services/user-media.service';

@Controller('users')
export class UserMediaController {
  constructor(private readonly userMediaService: UserMediaService) {}

  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('profile', createDiskUploadOptions('./uploads/profiles')))
  uploadImage(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<User> {
    return this.userMediaService.uploadImage(user, file);
  }
}
