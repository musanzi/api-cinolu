import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { ResourcesController } from './controllers/resources.controller';
import { ResourcesService } from './services/resources.service';
import { ProjectsModule } from '../../projects/projects/projects.module';
import { PhasesModule } from '../../projects/phases/phases.module';

@Module({
  imports: [ProjectsModule, PhasesModule, TypeOrmModule.forFeature([Resource])],
  providers: [ResourcesService],
  controllers: [ResourcesController]
})
export class ResourcesModule {}
