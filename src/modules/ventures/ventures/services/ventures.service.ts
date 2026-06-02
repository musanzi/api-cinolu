import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venture } from '../entities/venture.entity';
import { CreateVentureDto } from '../dto/create-venture.dto';
import { UpdateVentureDto } from '../dto/update-venture.dto';
import { FilterVenturesInterface } from '../interfaces/filter-ventures.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class VenturesService extends AbstractRepository<Venture> {
  constructor(
    @InjectRepository(Venture)
    repository: Repository<Venture>,
    private eventEmitter: EventEmitter2
  ) {
    super(repository);
  }

  async create(userId: string, dto: CreateVentureDto): Promise<Venture> {
    try {
      const savedVenture = await this.createEntity({
        ...dto,
        owner: { id: userId }
      });
      const venture = await this.findOne(savedVenture.id);
      this.eventEmitter.emit('venture.created', venture);
      return venture;
    } catch {
      throw new BadRequestException("Création de l'entreprise impossible");
    }
  }

  async findPublished(): Promise<Venture[]> {
    return await this.findEntities({ where: { is_published: true }, relations: ['gallery', 'products', 'owner'] });
  }

  async findBySlug(slug: string): Promise<Venture> {
    return await this.findEntity({
      where: { slug },
      relations: ['gallery', 'products', 'products.gallery', 'owner', 'documents']
    });
  }

  async togglePublish(slug: string): Promise<Venture> {
    try {
      const venture = await this.findBySlug(slug);
      const updatedVenture = await this.updateEntity(venture.id, { is_published: !venture.is_published });
      if (updatedVenture.is_published) this.eventEmitter.emit('venture.approved', updatedVenture);
      if (!updatedVenture.is_published) this.eventEmitter.emit('venture.rejected', updatedVenture);
      return updatedVenture;
    } catch {
      throw new BadRequestException('Publication impossible');
    }
  }

  async findByUser(page: string, userId: string): Promise<[Venture[], number]> {
    const skip = (+(page || 1) - 1) * 40;
    try {
      return await this.repository.findAndCount({
        where: { owner: { id: userId } },
        skip,
        take: 40,
        order: { created_at: 'DESC' }
      });
    } catch {
      throw new NotFoundException('Entreprises introuvables');
    }
  }

  async findByUserUnpaginated(userId: string): Promise<Venture[]> {
    return await this.findEntities({ where: { owner: { id: userId } }, order: { created_at: 'DESC' } });
  }

  async findAll(queryParams: FilterVenturesInterface): Promise<[Venture[], number]> {
    const { page, q } = queryParams;
    const query = this.repository.createQueryBuilder('venture').leftJoinAndSelect('venture.owner', 'owner');
    if (q) query.where('venture.name LIKE :q OR venture.description LIKE :q', { q: `%${q}%` });
    return await this.findPaginatedEntities(query.orderBy('venture.created_at', 'DESC'), { page, take: 40 });
  }

  async findOne(id: string): Promise<Venture> {
    return await this.findEntity({ where: { id }, relations: ['gallery', 'owner'] });
  }

  async update(slug: string, dto: UpdateVentureDto): Promise<Venture> {
    try {
      const venture = await this.findBySlug(slug);
      return await this.updateEntity(venture.id, dto);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async setLogo(id: string, logo: string): Promise<Venture> {
    return await this.updateEntity(id, { logo });
  }

  async setCover(id: string, cover: string): Promise<Venture> {
    return await this.updateEntity(id, { cover });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }
}
