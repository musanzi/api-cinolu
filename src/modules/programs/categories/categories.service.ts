import { Injectable } from '@nestjs/common';
import { ProgramCategory } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCategoryService } from '@/shared/helpers/abstract-category.service';

@Injectable()
export class ProgramCategoriesService extends BaseCategoryService<ProgramCategory> {
  constructor(@InjectRepository(ProgramCategory) categoryRepository: Repository<ProgramCategory>) {
    super(categoryRepository);
  }
}
