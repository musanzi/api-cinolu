import { Module } from '@nestjs/common';
import { ProgramsController } from './controllers/programs.controller';
import { ProgramsService } from './services/programs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './entities/program.entity';
import { ProgramSubscriber } from './subscribers/program.subscriber';
import { ProgramCategoriesModule } from '../../programs/categories/categories.module';
import { ProgramSectorsModule } from '../../programs/sectors/sectors.module';

@Module({
  imports: [ProgramCategoriesModule, ProgramSectorsModule, TypeOrmModule.forFeature([Program])],
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramSubscriber],
  exports: [ProgramsService]
})
export class ProgramsModule {}
