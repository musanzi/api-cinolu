import { Injectable } from '@nestjs/common';
import { ProjectCategory } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCategoryService } from '@/shared/helpers/abstract-category.service';

@Injectable()
export class ProjectCategoriesService extends BaseCategoryService<ProjectCategory> {
  constructor(@InjectRepository(ProjectCategory) categoryRepository: Repository<ProjectCategory>) {
    super(categoryRepository);
  }

  findAllPaginated(params: Parameters<BaseCategoryService<ProjectCategory>['findPaginated']>[0]) {
    return this.findPaginated(params);
  }
}
