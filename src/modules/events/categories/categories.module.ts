import { Module } from '@nestjs/common';
import { EventCategoriesService } from './categories.service';
import { EventCategoriesController } from './controllers/event-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventCategory } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventCategory])],
  controllers: [EventCategoriesController],
  providers: [EventCategoriesService]
})
export class EventCategoriesModule {}
