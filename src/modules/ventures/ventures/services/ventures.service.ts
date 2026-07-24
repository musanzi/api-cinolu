import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venture } from '../entities/venture.entity';
import { CreateVentureDto } from '../dto/create-venture.dto';
import { UpdateVentureDto } from '../dto/update-venture.dto';
import { FilterVenturesInterface } from '../interfaces/filter-ventures.interface';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { promises as fs } from 'fs';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { GalleriesService } from '../../../galleries/services/galleries.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class VenturesService extends AbstractRepository<Venture> {
  constructor(
    @InjectRepository(Venture)
    repository: Repository<Venture>,
    private eventEmitter: EventEmitter2,
    private readonly galleriesService: GalleriesService,
    private readonly mailerService: MailerService
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

  async addImage(ventureId: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.findOne(ventureId);
      const galleryDto = {
        image: file.filename,
        venture: { id: ventureId }
      };
      await this.galleriesService.create(galleryDto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeImage(galleryId: string): Promise<void> {
    try {
      await this.galleriesService.remove(galleryId);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('venture', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }

  async addLogo(ventureId: string, file: Express.Multer.File): Promise<Venture> {
    try {
      const venture = await this.findOne(ventureId);
      if (venture.logo) {
        await fs.unlink(`./uploads/ventures/logos/${venture.logo}`).catch(() => undefined);
      }
      return await this.setLogo(ventureId, file.filename);
    } catch {
      throw new BadRequestException('Ajout du logo impossible');
    }
  }

  async addCover(ventureId: string, file: Express.Multer.File): Promise<Venture> {
    try {
      const venture = await this.findOne(ventureId);
      if (venture.cover) {
        await fs.unlink(`./uploads/ventures/covers/${venture.cover}`).catch(() => undefined);
      }
      return await this.setCover(ventureId, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }

  @OnEvent('venture.created')
  async sendBusinessCreatedEmail(venture: Venture): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: venture.owner.email,
        subject: 'Entreprise créée avec succès',
        text: [
          `Bonjour ${venture.owner.name},`,
          '',
          `Votre entreprise "${venture.name}" a ete creee avec succes sur CINOLU.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('venture.approved')
  async sendVentureApprovalEmail(venture: Venture): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: venture.owner.email,
        subject: 'Votre entreprise a été approuvée!',
        text: [
          `Bonjour ${venture.owner.name},`,
          '',
          `Votre entreprise "${venture.name}" a ete approuvee.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('venture.rejected')
  async sendVentureRejectionEmail(venture: Venture): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: venture.owner.email,
        subject: 'Décision concernant votre entreprise',
        text: [
          `Bonjour ${venture.owner.name},`,
          '',
          `Decision concernant votre entreprise "${venture.name}": elle n'a pas ete approuvee pour le moment.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
