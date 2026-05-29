import { Module } from '@nestjs/common';
import { ProgramCategoriesService } from './categories.service';
import { ProgramCategoriesController } from './controllers/program-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramCategory } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramCategory])],
  controllers: [ProgramCategoriesController],
  providers: [ProgramCategoriesService]
})
export class ProgramCategoriesModule {}
