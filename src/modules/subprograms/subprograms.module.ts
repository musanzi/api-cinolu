import { Module } from '@nestjs/common';
import { SubprogramMediaController } from './controllers/subprogram-media.controller';
import { SubprogramsController } from './controllers/subprograms.controller';
import { SubprogramsService } from './services/subprograms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subprogram } from './entities/subprogram.entity';
import { SubprogramSubscriber } from './subscribers/subprogram.subscriber';
import { EventsModule } from '../events/events.module';
import { ProjectsModule } from '../projects/projects.module';
import { SubprogramMediaService } from './services/subprogram-media.service';
import { SUBPROGRAMS_RBAC_POLICY } from './subprograms-rbac';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subprogram]),
    ProjectsModule,
    EventsModule,
    SessionAuthModule.forFeature([SUBPROGRAMS_RBAC_POLICY])
  ],
  controllers: [SubprogramsController, SubprogramMediaController],
  providers: [SubprogramsService, SubprogramMediaService, SubprogramSubscriber]
})
export class SubprogramsModule {}
