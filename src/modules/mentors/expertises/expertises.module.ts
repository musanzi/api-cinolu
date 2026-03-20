import { Module } from '@nestjs/common';
import { ExpertisesService } from './expertises.service';
import { ExpertisesController } from './controllers/expertises.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expertise } from './entities/expertise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expertise])],
  controllers: [ExpertisesController],
  providers: [ExpertisesService]
})
export class ExpertisesModule {}
