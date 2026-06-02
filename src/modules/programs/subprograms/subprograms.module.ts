import { Module } from '@nestjs/common';
import { SubprogramMediaController } from './controllers/subprogram-media.controller';
import { SubprogramsController } from './controllers/subprograms.controller';
import { SubprogramsService } from './services/subprograms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subprogram } from './entities/subprogram.entity';
import { SubprogramSubscriber } from './subscribers/subprogram.subscriber';
import { EventsModule } from '../../events/events/events.module';
import { ProjectsModule } from '../../projects/projects/projects.module';
import { SubprogramMediaService } from './services/subprogram-media.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subprogram]), ProjectsModule, EventsModule],
  controllers: [SubprogramsController, SubprogramMediaController],
  providers: [SubprogramsService, SubprogramMediaService, SubprogramSubscriber]
})
export class SubprogramsModule {}
