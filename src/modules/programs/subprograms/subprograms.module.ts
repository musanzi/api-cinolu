import { Module } from '@nestjs/common';
import { SubprogramsController } from './controllers/subprograms.controller';
import { SubprogramsService } from './services/subprograms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subprogram } from './entities/subprogram.entity';
import { SubprogramSubscriber } from './subscribers/subprogram.subscriber';
import { EventsModule } from '../../events/events/events.module';
import { ProjectsModule } from '../../projects/projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subprogram]), ProjectsModule, EventsModule],
  controllers: [SubprogramsController],
  providers: [SubprogramsService, SubprogramSubscriber]
})
export class SubprogramsModule {}
