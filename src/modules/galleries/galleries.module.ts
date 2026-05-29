import { Module } from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gallery } from './entities/gallery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gallery])],
  providers: [GalleriesService],
  exports: [GalleriesService]
})
export class GalleriesModule {}
