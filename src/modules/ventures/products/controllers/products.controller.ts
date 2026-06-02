import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { FilterProductsInterface } from '../interfaces/filter-products.interface';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { ProductsService } from '../services/products.service';
import { CurrentUser, Public, Roles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: User, @Query() query: FilterProductsInterface): Promise<[Product[], number]> {
    return this.productsService.findAll(user.id, query);
  }

  @Get('by-slug/:slug')
  @Public()
  findOne(@Param('slug') slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug);
  }

  @Patch('by-slug/:slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateProductDto): Promise<Product> {
    return this.productsService.update(slug, dto);
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
