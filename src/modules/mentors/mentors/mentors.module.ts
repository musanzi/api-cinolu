import { Module } from '@nestjs/common';
import { MentorsController } from './controllers/mentors.controller';
import { MentorsService } from './services/mentors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorProfile } from './entities/mentor.entity';
import { Experience } from './entities/experience.entity';
import { ExpertisesModule } from '../../mentors/expertises/expertises.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([MentorProfile, Experience]), ExpertisesModule, UsersModule],
  controllers: [MentorsController],
  providers: [MentorsService],
  exports: [MentorsService]
})
export class MentorsModule {}
