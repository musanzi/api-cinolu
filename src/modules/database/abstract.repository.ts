import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder
} from 'typeorm';
import { PaginationInterface } from './interfaces/pagination.interface';
import { AbstractEntity } from './abstract.entity';

export abstract class AbstractRepository<EntityType extends AbstractEntity> {
  protected readonly logger: Logger;

  protected constructor(protected readonly repository: Repository<EntityType>) {
    this.logger = new Logger(this.constructor.name);
  }

  async createEntity(dto: DeepPartial<EntityType>): Promise<EntityType> {
    try {
      const entity = this.repository.create(dto);
      return await this.repository.save(entity);
    } catch (error) {
      this.logError('create', error);
      throw new BadRequestException('Une erreur est survenue lors de la création de cette ressource');
    }
  }

  async saveEntity(dto: DeepPartial<EntityType>): Promise<EntityType> {
    try {
      return await this.repository.save(dto);
    } catch (error) {
      this.logError('save', error);
      throw new BadRequestException("Une erreur est survenue lors de l'enregistrement de cette ressource");
    }
  }

  async findEntities(options?: FindManyOptions<EntityType>): Promise<EntityType[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      this.logError('find all', error);
      throw error;
    }
  }

  async findPaginatedEntities(
    query: SelectQueryBuilder<EntityType>,
    { page = 1, take = 20 }: PaginationInterface = {}
  ): Promise<[EntityType[], number]> {
    try {
      const pageNumber = Number(page);
      const takeNumber = Number(take);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(takeNumber) || takeNumber < 1) {
        throw new BadRequestException('Les paramètres de pagination sont invalides');
      }
      return await query
        .skip((pageNumber - 1) * takeNumber)
        .take(takeNumber)
        .getManyAndCount();
    } catch (error) {
      this.logError('find paginated', error);
      throw error;
    }
  }

  async findEntity(options: FindOneOptions<EntityType>): Promise<EntityType> {
    try {
      return await this.repository.findOneOrFail(options);
    } catch (error) {
      this.logError('find one', error);
      throw new NotFoundException('La ressource demandée est introuvable');
    }
  }

  async updateEntity(id: string, dto: DeepPartial<EntityType>): Promise<EntityType> {
    try {
      const entity = await this.findEntity({
        where: { id } as FindOptionsWhere<EntityType>
      });
      const newEntity = this.repository.merge(entity, dto);
      return await this.repository.save(newEntity);
    } catch (error) {
      this.logError('update', error);
      throw new BadRequestException('Une erreur est survenue lors de la mise à jour');
    }
  }

  async deleteEntity(id: string): Promise<void> {
    try {
      await this.repository.softDelete(id);
    } catch (error) {
      this.logError('delete', error);
      throw new BadRequestException('Une erreur est survenue lors de la suppression');
    }
  }

  async softDeleteEntity(id: string): Promise<void> {
    try {
      await this.repository.softDelete(id);
    } catch (error) {
      this.logError('soft delete', error);
      throw new BadRequestException('Une erreur est survenue lors de la suppression');
    }
  }

  async hardDeleteEntity(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      this.logError('hard delete', error);
      throw new BadRequestException('Une erreur est survenue lors de la suppression');
    }
  }

  private logError(operation: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`Repository ${operation} failed: ${message}`, stack);
  }
}
