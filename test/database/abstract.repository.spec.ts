import { AbstractRepository } from '@/modules/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';

type TestEntity = {
  id: string;
  name: string;
};

class TestRepository extends AbstractRepository<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository);
  }
}

describe('AbstractRepository', () => {
  const setup = () => {
    const repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn()
    } as unknown as jest.Mocked<Repository<TestEntity>>;
    const abstractRepository = new TestRepository(repository);

    return { abstractRepository, repository };
  };

  it('creates an entity', async () => {
    const { abstractRepository, repository } = setup();
    const entity = { id: '1', name: 'Test' };
    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await expect(abstractRepository.createEntity({ name: 'Test' })).resolves.toEqual(entity);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Test' });
    expect(repository.save).toHaveBeenCalledWith(entity);
  });

  it('finds all entities', async () => {
    const { abstractRepository, repository } = setup();
    const entities = [{ id: '1', name: 'Test' }];
    repository.find.mockResolvedValue(entities);

    await expect(abstractRepository.findEntities({ take: 10 })).resolves.toEqual(entities);
    expect(repository.find).toHaveBeenCalledWith({ take: 10 });
  });

  it('finds paginated entities with default pagination', async () => {
    const { abstractRepository } = setup();
    const result: [TestEntity[], number] = [[{ id: '1', name: 'Test' }], 1];
    const query = {
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue(result)
    } as unknown as SelectQueryBuilder<TestEntity>;

    await expect(abstractRepository.findPaginatedEntities(query)).resolves.toEqual(result);
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.take).toHaveBeenCalledWith(20);
  });

  it('finds paginated entities with custom string pagination', async () => {
    const { abstractRepository } = setup();
    const result: [TestEntity[], number] = [[{ id: '1', name: 'Test' }], 1];
    const query = {
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue(result)
    } as unknown as SelectQueryBuilder<TestEntity>;

    await expect(abstractRepository.findPaginatedEntities(query, { page: '3', take: '10' })).resolves.toEqual(result);
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.take).toHaveBeenCalledWith(10);
  });

  it('rejects invalid pagination', async () => {
    const { abstractRepository } = setup();
    const query = {} as SelectQueryBuilder<TestEntity>;

    await expect(abstractRepository.findPaginatedEntities(query, { page: 0 })).rejects.toThrow(
      'Les paramètres de pagination sont invalides'
    );
  });

  it('finds one entity', async () => {
    const { abstractRepository, repository } = setup();
    const entity = { id: '1', name: 'Test' };
    repository.findOneOrFail.mockResolvedValue(entity);

    await expect(abstractRepository.findEntity({ where: { id: '1' } })).resolves.toEqual(entity);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('updates an entity', async () => {
    const { abstractRepository, repository } = setup();
    const entity = { id: '1', name: 'Test' };
    const updatedEntity = { id: '1', name: 'Updated' };
    repository.findOneOrFail.mockResolvedValue(entity);
    repository.merge.mockReturnValue(updatedEntity);
    repository.save.mockResolvedValue(updatedEntity);

    await expect(abstractRepository.updateEntity('1', { name: 'Updated' })).resolves.toEqual(updatedEntity);
    expect(repository.merge).toHaveBeenCalledWith(entity, { name: 'Updated' });
    expect(repository.save).toHaveBeenCalledWith(updatedEntity);
  });

  it('soft deletes an entity', async () => {
    const { abstractRepository, repository } = setup();
    const entity = { id: '1', name: 'Test' };
    repository.findOneOrFail.mockResolvedValue(entity);
    repository.softDelete.mockResolvedValue({ affected: 1, generatedMaps: [], raw: [] });

    await expect(abstractRepository.deleteEntity('1')).resolves.toBeUndefined();
    expect(repository.softDelete).toHaveBeenCalledWith('1');
  });

  it('rethrows find errors', async () => {
    const error = new Error('database unavailable');
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { abstractRepository, repository } = setup();
    repository.find.mockRejectedValue(error);

    await expect(abstractRepository.findEntities()).rejects.toBe(error);
    expect(logger).toHaveBeenCalledWith('Repository find all failed: database unavailable', error.stack);

    logger.mockRestore();
  });
});
