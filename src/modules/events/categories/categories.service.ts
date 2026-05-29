import { Injectable } from '@nestjs/common';
import { EventCategory } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCategoryService } from '@/shared/helpers/abstract-category.service';

@Injectable()
export class EventCategoriesService extends BaseCategoryService<EventCategory> {
  constructor(@InjectRepository(EventCategory) categoryRepository: Repository<EventCategory>) {
    super(categoryRepository);
  }

  findAllPaginated(params: Parameters<BaseCategoryService<EventCategory>['findPaginated']>[0]) {
    return this.findPaginated(params);
  }
}
