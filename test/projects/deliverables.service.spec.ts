import { BadRequestException } from '@nestjs/common';
import { DeliverablesService } from '@/modules/projects/phases/deliverables/services/deliverables.service';

describe('DeliverablesService', () => {
  const setup = () => {
    const deliverableRepository = {
      save: jest.fn(),
      find: jest.fn(),
      softDelete: jest.fn()
    } as any;
    const service = new DeliverablesService(deliverableRepository);
    return { service, deliverableRepository };
  };

  it('creates deliverables', async () => {
    const { service, deliverableRepository } = setup();
    deliverableRepository.save.mockResolvedValue([{ id: 'd1' }]);
    await expect(service.create('phase-1', [{ title: 'A', description: 'B' }] as any)).resolves.toEqual([{ id: 'd1' }]);
  });

  it('returns early on empty create payload', async () => {
    const { service, deliverableRepository } = setup();
    await expect(service.create('phase-1', [] as any)).resolves.toBeUndefined();
    expect(deliverableRepository.save).not.toHaveBeenCalled();
  });

  it('throws on create failure', async () => {
    const { service, deliverableRepository } = setup();
    deliverableRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create('phase-1', [{ title: 'A' }] as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sync updates changed, removes missing, and creates new', async () => {
    const { service, deliverableRepository } = setup();
    deliverableRepository.find.mockResolvedValue([
      { id: 'd1', title: 'Old 1', description: 'x' },
      { id: 'd2', title: 'Keep', description: null },
      { id: 'd3', title: 'Delete', description: null }
    ]);
    deliverableRepository.save.mockResolvedValue(undefined);
    deliverableRepository.softDelete.mockResolvedValue(undefined);

    await expect(
      service.sync('phase-1', [
        { id: 'd1', title: 'New 1', description: 'y' },
        { id: 'd2', title: 'Keep', description: null },
        { title: 'Brand new', description: 'n' }
      ] as any)
    ).resolves.toBeUndefined();

    expect(deliverableRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1', title: 'New 1' }));
    expect(deliverableRepository.softDelete).toHaveBeenCalledWith(['d3']);
    expect(deliverableRepository.save).toHaveBeenCalledWith([
      { title: 'Brand new', description: 'n', phase: { id: 'phase-1' } }
    ]);
  });

  it('returns early on empty sync payload', async () => {
    const { service, deliverableRepository } = setup();
    await expect(service.sync('phase-1', [] as any)).resolves.toBeUndefined();
    expect(deliverableRepository.find).not.toHaveBeenCalled();
  });

  it('throws when sync contains unknown id', async () => {
    const { service, deliverableRepository } = setup();
    deliverableRepository.find.mockResolvedValue([{ id: 'd1', title: 'A' }]);
    await expect(service.sync('phase-1', [{ id: 'd999', title: 'X' }] as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('throws on sync repository failure', async () => {
    const { service, deliverableRepository } = setup();
    deliverableRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.sync('phase-1', [{ id: 'd1', title: 'A' }] as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });
});
