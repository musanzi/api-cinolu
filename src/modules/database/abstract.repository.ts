import { Logger } from '@nestjs/common';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  QueryDeepPartialEntity,
  Repository,
  UpdateResult
} from 'typeorm';

export abstract class AbstractRepository<Entity extends ObjectLiteral> {
  protected readonly logger: Logger;

  protected constructor(
    protected readonly repository: Repository<Entity>,
    context: string
  ) {
    this.logger = new Logger(context);
  }

  create(entity: DeepPartial<Entity>): Promise<Entity> {
    return this.execute('create', () => this.repository.save(this.repository.create(entity)));
  }

  findAll(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.execute('find all', () => this.repository.find(options));
  }

  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.execute('find one', () => this.repository.findOne(options));
  }

  update(
    criteria: Parameters<Repository<Entity>['update']>[0],
    partialEntity: QueryDeepPartialEntity<Entity>
  ): Promise<UpdateResult> {
    return this.execute('update', () => this.repository.update(criteria, partialEntity));
  }

  delete(criteria: Parameters<Repository<Entity>['delete']>[0]): Promise<DeleteResult> {
    return this.execute('delete', () => this.repository.delete(criteria));
  }

  protected async execute<Result>(operation: string, callback: () => Promise<Result>): Promise<Result> {
    try {
      return await callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Repository ${operation} failed: ${message}`, stack);
      throw error;
    }
  }
}
