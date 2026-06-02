import { Logger } from '@nestjs/common';
import { AbstractRepository } from '@/modules/database/abstract.repository';
import { Repository } from 'typeorm';

type TestEntity = {
  id: string;
  name: string;
};

class TestRepository extends AbstractRepository<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository, TestRepository.name);
  }
}

describe('AbstractRepository', () => {
  const setup = () => {
    const repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<Repository<TestEntity>>;
    const abstractRepository = new TestRepository(repository);

    return { abstractRepository, repository };
  };

  it('creates an entity', async () => {
    const { abstractRepository, repository } = setup();
    const entity = { id: '1', name: 'Test' };
    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await expect(abstractRepository.create({ name: 'Test' })).resolves.toEqual(entity);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Test' });
    expect(repository.save).toHaveBeenCalledWith(entity);
  });

  it('finds all entities', async () => {
    const { abstractRepository, repository } = setup();
    const entities = [{ id: '1', name: 'Test' }];
    repository.find.mockResolvedValue(entities);

    await expect(abstractRepository.findAll({ take: 10 })).resolves.toEqual(entities);
    expect(repository.find).toHaveBeenCalledWith({ take: 10 });
  });

  it('finds one entity', async () => {
    const { abstractRepository, repository } = setup();
    const entity = { id: '1', name: 'Test' };
    repository.findOne.mockResolvedValue(entity);

    await expect(abstractRepository.findOne({ where: { id: '1' } })).resolves.toEqual(entity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('updates entities', async () => {
    const { abstractRepository, repository } = setup();
    const result = { affected: 1, generatedMaps: [], raw: [] };
    repository.update.mockResolvedValue(result);

    await expect(abstractRepository.update({ id: '1' }, { name: 'Updated' })).resolves.toEqual(result);
    expect(repository.update).toHaveBeenCalledWith({ id: '1' }, { name: 'Updated' });
  });

  it('deletes entities', async () => {
    const { abstractRepository, repository } = setup();
    const result = { affected: 1, raw: [] };
    repository.delete.mockResolvedValue(result);

    await expect(abstractRepository.delete({ id: '1' })).resolves.toEqual(result);
    expect(repository.delete).toHaveBeenCalledWith({ id: '1' });
  });

  it('logs errors and rethrows them', async () => {
    const error = new Error('database unavailable');
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { abstractRepository, repository } = setup();
    repository.find.mockRejectedValue(error);

    await expect(abstractRepository.findAll()).rejects.toBe(error);
    expect(logger).toHaveBeenCalledWith('Repository find all failed: database unavailable', error.stack);

    logger.mockRestore();
  });
});
