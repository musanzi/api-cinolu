import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venture } from '../entities/venture.entity';
import { User } from '@/modules/users/entities/user.entity';
import { CreateVentureDto } from '../dto/create-venture.dto';
import { UpdateVentureDto } from '../dto/update-venture.dto';
import { FilterVenturesDto } from '../dto/filter-ventures.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VenturesService {
  constructor(
    @InjectRepository(Venture)
    private ventureRepository: Repository<Venture>,
    private eventEmitter: EventEmitter2
  ) {}

  async create(user: User, dto: CreateVentureDto): Promise<Venture> {
    try {
      const savedVenture = await this.ventureRepository.save({
        ...dto,
        owner: { id: user.id }
      });
      const venture = await this.findOne(savedVenture.id);
      this.eventEmitter.emit('venture.created', venture);
      return venture;
    } catch {
      throw new BadRequestException("Création de l'entreprise impossible");
    }
  }

  async findPublished(): Promise<Venture[]> {
    try {
      return await this.ventureRepository.find({
        where: { is_published: true },
        relations: ['gallery', 'products', 'owner']
      });
    } catch {
      throw new NotFoundException('Entreprises introuvables');
    }
  }

  async findBySlug(slug: string): Promise<Venture> {
    try {
      return await this.ventureRepository.findOneOrFail({
        where: { slug },
        relations: ['gallery', 'products', 'products.gallery', 'owner', 'documents']
      });
    } catch {
      throw new NotFoundException('Entreprise introuvable');
    }
  }

  async togglePublish(slug: string): Promise<Venture> {
    try {
      const venture = await this.findBySlug(slug);
      const updatedVenture = await this.ventureRepository.save({ ...venture, is_published: !venture.is_published });
      if (updatedVenture.is_published) this.eventEmitter.emit('venture.approved', updatedVenture);
      if (!updatedVenture.is_published) this.eventEmitter.emit('venture.rejected', updatedVenture);
      return updatedVenture;
    } catch {
      throw new BadRequestException('Publication impossible');
    }
  }

  async findByUser(page: string, user: User): Promise<[Venture[], number]> {
    const skip = (+(page || 1) - 1) * 40;
    try {
      return await this.ventureRepository.findAndCount({
        where: { owner: { id: user.id } },
        skip,
        take: 40,
        order: { created_at: 'DESC' }
      });
    } catch {
      throw new NotFoundException('Entreprises introuvables');
    }
  }

  async findByUserUnpaginated(user: User): Promise<Venture[]> {
    try {
      return await this.ventureRepository.find({
        where: { owner: { id: user.id } },
        order: { created_at: 'DESC' }
      });
    } catch {
      throw new NotFoundException('Entreprises introuvables');
    }
  }

  async findAll(queryParams: FilterVenturesDto): Promise<[Venture[], number]> {
    try {
      const { page = 1, q } = queryParams;
      const take = 40;
      const skip = (+page - 1) * take;
      const query = this.ventureRepository.createQueryBuilder('venture').leftJoinAndSelect('venture.owner', 'owner');
      if (q) query.where('venture.name LIKE :q OR venture.description LIKE :q', { q: `%${q}%` });
      return await query.orderBy('venture.created_at', 'DESC').skip(skip).take(take).getManyAndCount();
    } catch {
      throw new BadRequestException('Entreprises introuvables');
    }
  }

  async findOne(id: string): Promise<Venture> {
    try {
      return await this.ventureRepository.findOneOrFail({
        where: { id },
        relations: ['gallery', 'owner']
      });
    } catch {
      throw new NotFoundException('Entreprise introuvable');
    }
  }

  async update(slug: string, dto: UpdateVentureDto): Promise<Venture> {
    try {
      const venture = await this.findBySlug(slug);
      Object.assign(venture, dto);
      return await this.ventureRepository.save(venture);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async setLogo(id: string, logo: string): Promise<Venture> {
    try {
      const venture = await this.findOne(id);
      venture.logo = logo;
      return await this.ventureRepository.save(venture);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }

  async setCover(id: string, cover: string): Promise<Venture> {
    try {
      const venture = await this.findOne(id);
      venture.cover = cover;
      return await this.ventureRepository.save(venture);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const venture = await this.findOne(id);
      await this.ventureRepository.softDelete(venture.id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
