import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { ProductMediaService } from '../services/product-media.service';

@Controller('products')
export class ProductMediaController {
  constructor(private readonly productMediaService: ProductMediaService) {}

  @Post('id/:productId/gallery')
  @Rbac({ resource: 'products', action: 'update' })
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('productId') productId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.productMediaService.addImage(productId, file);
  }

  @Delete('gallery/:galleryId')
  @Rbac({ resource: 'products', action: 'update' })
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.productMediaService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.productMediaService.findGallery(slug);
  }
}
