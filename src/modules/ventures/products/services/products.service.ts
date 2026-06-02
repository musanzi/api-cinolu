import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Repository } from 'typeorm';
import { FilterProductsInterface } from '../interfaces/filter-products.interface';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class ProductsService extends AbstractRepository<Product> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>
  ) {
    super(repository);
  }

  async findAll(userId: string, query: FilterProductsInterface): Promise<[Product[], number]> {
    try {
      const { page = 1 } = query;
      return await this.repository.findAndCount({
        where: { venture: { owner: { id: userId } } },
        order: { created_at: 'DESC' },
        take: 10,
        skip: (+page - 1) * 10
      });
    } catch {
      throw new NotFoundException('Produits introuvables');
    }
  }

  async create(dto: CreateProductDto): Promise<Product> {
    return await this.createEntity({ ...dto, venture: { id: dto.ventureId } });
  }

  async findBySlug(slug: string): Promise<Product> {
    return await this.findEntity({ where: { slug }, relations: ['venture', 'gallery'] });
  }

  async findOne(id: string): Promise<Product> {
    return await this.findEntity({ where: { id }, relations: ['gallery'] });
  }

  async update(slug: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findBySlug(slug);
    return await this.updateEntity(product.id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
