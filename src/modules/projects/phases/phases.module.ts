import { Module } from '@nestjs/common';
import { PhasesService } from './services/phases.service';
import { PhasesController } from './controllers/phases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from './entities/phase.entity';
import { ProjectDeliverablesModule } from './deliverables/deliverables.module';

@Module({
  imports: [ProjectDeliverablesModule, TypeOrmModule.forFeature([Phase])],
  providers: [PhasesService],
  controllers: [PhasesController],
  exports: [PhasesService]
})
export class PhasesModule {}
