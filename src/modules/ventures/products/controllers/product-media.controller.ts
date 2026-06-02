import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { ProductMediaService } from '../services/product-media.service';

@Controller('products')
export class ProductMediaController {
  constructor(private readonly productMediaService: ProductMediaService) {}

  @Post('id/:productId/gallery')
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('productId') productId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.productMediaService.addImage(productId, file);
  }

  @Delete('gallery/:galleryId')
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.productMediaService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.productMediaService.findGallery(slug);
  }
}
