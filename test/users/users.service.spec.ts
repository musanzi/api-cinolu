import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { parseUsersCsv } from '@/modules/identity/users/helpers/user-csv.helper';
import { UserStatus } from '@/modules/identity/users/types/user-status.enum';

jest.mock('@/modules/identity/users/helpers/user-csv.helper', () => ({
  parseUsersCsv: jest.fn()
}));

const makeUsersQueryBuilder = () => ({
  addSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOneOrFail: jest.fn().mockResolvedValue({ id: 'u1', roles: [{ name: 'user' }] }),
  getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'u1' }], 1]),
  getMany: jest.fn().mockResolvedValue([{ id: 'u1' }])
});

describe('UsersService', () => {
  const setup = () => {
    const queryBuilder = makeUsersQueryBuilder();
    const userRepository = {
      create: jest.fn((dto) => dto),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      count: jest.fn(),
      softDelete: jest.fn(),
      delete: jest.fn()
    } as any;
    const rolesService = { findByName: jest.fn() } as any;
    const eventEmitter = { emit: jest.fn() } as any;
    const service = new UsersService(userRepository, rolesService, eventEmitter);
    jest.spyOn(service as any, 'generateReferralCode').mockReturnValue('ref-code');
    return { service, userRepository, rolesService, eventEmitter, queryBuilder };
  };

  it('finds users by ids', async () => {
    const { service, userRepository } = setup();
    userRepository.find.mockResolvedValue([{ id: 'u1' }]);
    await expect(service.findByIds(['u1'])).resolves.toEqual([{ id: 'u1' }]);
  });

  it('throws on findByIds failure', async () => {
    const { service, userRepository } = setup();
    userRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findByIds(['u1'])).rejects.toThrow('bad');
  });

  it('finds staff', async () => {
    const { service, rolesService, userRepository } = setup();
    rolesService.findByName.mockResolvedValue({ id: 'r1' });
    userRepository.find.mockResolvedValue([{ id: 'u1' }]);
    await expect(service.findStaff()).resolves.toEqual([{ id: 'u1' }]);
  });

  it('assigns role to user', async () => {
    const { service, rolesService, userRepository } = setup();
    rolesService.findByName.mockResolvedValue({ id: 'r1', name: 'staff' });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'u1', roles: [] } as any);
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [] });
    userRepository.save.mockResolvedValue({ id: 'u1' });
    await expect(service.assignRole('u1', 'staff')).resolves.toEqual({ id: 'u1' });
  });

  it('creates user with defaults', async () => {
    const { service, userRepository } = setup();
    userRepository.save.mockResolvedValue({ id: 'u1' });
    await expect(
      service.create({ email: 'a@a.com', roles: ['r1'], status: UserStatus.ENTREPRENEUR } as any)
    ).resolves.toEqual({ id: 'u1' });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        referral_code: 'ref-code',
        status: UserStatus.ENTREPRENEUR,
        roles: [{ id: 'r1' }]
      })
    );
  });

  it('finds entrepreneurs', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findEntrepreneurs()).resolves.toEqual([{ id: 'u1' }]);
    expect(queryBuilder.where).toHaveBeenCalledWith('ventures.id IS NOT NULL');
  });

  it('finds all users with pagination and search', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findAll({ page: 2, q: 'john' } as any)).resolves.toEqual([[{ id: 'u1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('u.name LIKE :q OR u.email LIKE :q', { q: '%john%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(50);
  });

  it('searches users', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.search(' john ')).resolves.toEqual([{ id: 'u1' }]);
    expect(queryBuilder.where).toHaveBeenCalledWith('u.name LIKE :q OR u.email LIKE :q', { q: '%john%' });
  });

  it('finds referring user', async () => {
    const { service, userRepository } = setup();
    userRepository.findOne.mockResolvedValue({ id: 'u1' });
    await expect(service.referredBy('ref')).resolves.toEqual({ id: 'u1' });
  });

  it('finds one user and maps roles', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [{ name: 'user' }] });
    await expect(service.findOne('u1')).resolves.toEqual(expect.objectContaining({ roles: ['user'] }));
  });

  it('throws on findOne failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds user by email and computes referral count', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [{ name: 'user' }] });
    userRepository.count.mockResolvedValue(3);
    await expect(service.findByEmail('a@a.com')).resolves.toEqual(
      expect.objectContaining({ roles: ['user'], referralsCount: 3 })
    );
  });

  it('throws not found for missing email', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findByEmail('x@x.com')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds one by email', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1' });
    await expect(service.findOneByEmail('a@a.com')).resolves.toEqual({ id: 'u1' });
  });

  it('throws not found for findOneByEmail failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOneByEmail('a@a.com')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds or updates existing user', async () => {
    const { service, userRepository } = setup();
    userRepository.findOne.mockResolvedValue({ id: 'u1' });
    jest.spyOn(service, 'update').mockResolvedValue({ id: 'u1', name: 'new' } as any);
    await expect(service.findOrCreate({ email: 'a@a.com', name: 'new' } as any)).resolves.toEqual({
      id: 'u1',
      name: 'new'
    });
  });

  it('creates user when not existing', async () => {
    const { service, userRepository, rolesService } = setup();
    userRepository.findOne.mockResolvedValue(null);
    rolesService.findByName.mockResolvedValue({ id: 'role-user' });
    userRepository.save.mockResolvedValue({ id: 'u-new' });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'u-new' } as any);
    await expect(service.findOrCreate({ email: 'n@n.com' } as any)).resolves.toEqual({ id: 'u-new' });
  });

  it('throws on findOrCreate failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.findOrCreate({ email: 'a@a.com' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('imports users from csv', async () => {
    const { service } = setup();
    (parseUsersCsv as jest.Mock).mockResolvedValue([{ email: 'a@a.com' }, { email: 'b@b.com' }]);
    const findOrCreateSpy = jest.spyOn(service, 'findOrCreate').mockResolvedValue({ id: 'u1' } as any);
    await expect(service.importCsv({ buffer: Buffer.from('x') } as any)).resolves.toBeUndefined();
    expect(findOrCreateSpy).toHaveBeenCalledTimes(2);
  });

  it('throws on importCsv failure', async () => {
    const { service } = setup();
    (parseUsersCsv as jest.Mock).mockRejectedValue(new Error('bad'));
    await expect(service.importCsv({ buffer: Buffer.from('x') } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates user and remaps roles', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [{ id: 'r-old' }] });
    userRepository.save.mockResolvedValue({ id: 'u1' });
    await expect(service.update('u1', { roles: ['r1'] } as any)).resolves.toEqual({ id: 'u1' });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'u1',
        roles: [{ id: 'r1' }]
      })
    );
  });

  it('throws on update failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.update('u1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes user', async () => {
    const { service, userRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'u1' } as any);
    userRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('u1')).resolves.toBeUndefined();
  });

  it('throws on remove failure', async () => {
    const { service, userRepository } = setup();
    userRepository.softDelete.mockRejectedValue(new Error('bad'));
    await expect(service.remove('u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hard deletes users with invalid email or name on clear', async () => {
    const { service, userRepository } = setup();
    userRepository.find.mockResolvedValue([
      { id: 'u1', email: 'john@example.com', name: 'John' },
      { id: 'u2', email: 'bad-email', name: 'Jane' },
      { id: 'u3', email: 'mark@example.com', name: '@@@' }
    ]);
    userRepository.delete.mockResolvedValue({});

    await expect(service.clear()).resolves.toBe(2);
    expect(userRepository.delete).toHaveBeenCalledWith(['u2', 'u3']);
  });

  it('returns 0 on clear when all users are valid', async () => {
    const { service, userRepository } = setup();
    userRepository.find.mockResolvedValue([{ id: 'u1', email: 'john@example.com', name: 'John' }]);

    await expect(service.clear()).resolves.toBe(0);
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('throws on clear failure', async () => {
    const { service, userRepository } = setup();
    userRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.clear()).rejects.toBeInstanceOf(BadRequestException);
  });
});
