import { Module } from '@nestjs/common';
import { ProjectCategoriesService } from './categories.service';
import { ProjectCategoriesController } from './controllers/project-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCategory } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectCategory])],
  controllers: [ProjectCategoriesController],
  providers: [ProjectCategoriesService]
})
export class ProjectCategoriesModule {}
