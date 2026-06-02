import { Module } from '@nestjs/common';
import { MentorMediaController } from './controllers/mentor-media.controller';
import { MentorsController } from './controllers/mentors.controller';
import { MentorsService } from './services/mentors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorProfile } from './entities/mentor.entity';
import { Experience } from './entities/experience.entity';
import { ExpertisesModule } from '../../mentors/expertises/expertises.module';
import { UsersModule } from '../../identity/users/users.module';
import { MentorExperiencesService } from './services/mentor-experiences.service';
import { MentorsEmailService } from './services/mentors-email.service';
import { MentorMediaService } from './services/mentor-media.service';

@Module({
  imports: [TypeOrmModule.forFeature([MentorProfile, Experience]), ExpertisesModule, UsersModule],
  controllers: [MentorsController, MentorMediaController],
  providers: [MentorsService, MentorMediaService, MentorExperiencesService, MentorsEmailService],
  exports: [MentorsService]
})
export class MentorsModule {}
