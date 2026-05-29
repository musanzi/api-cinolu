import { AuthService } from '../../src/modules/auth/services/auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

describe('AuthService', () => {
  const setup = () => {
    const usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findOrCreate: jest.fn(),
      signUp: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn()
    } as any;
    const eventEmitter = { emit: jest.fn() } as any;
    const jwtService = { verifyAsync: jest.fn() } as any;
    const configService = { get: jest.fn() } as any;
    const service = new AuthService(usersService, eventEmitter, jwtService, configService);
    return { service, usersService, eventEmitter };
  };

  it('signs up and sends welcome event for new users', async () => {
    const { service, usersService, eventEmitter } = setup();
    const user = { id: 'u1', email: 'john@example.com' };
    const dto = { name: 'John Doe', email: user.email, password: 'secret123' };
    usersService.signUp.mockResolvedValue({ user, isNew: true });

    await expect(service.signUp(dto as any)).resolves.toEqual(expect.objectContaining(user));

    expect(usersService.signUp).toHaveBeenCalledWith(dto);
    expect(eventEmitter.emit).toHaveBeenCalledWith('user.welcome', expect.objectContaining(user));
  });

  it('validates user with explicit password selection and hides password after login', async () => {
    const { service, usersService } = setup();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'u1',
      email: 'john@example.com',
      password: 'hashed',
      roles: ['user']
    });

    await expect(service.validateUser('john@example.com', 'secret123')).resolves.toEqual({
      id: 'u1',
      email: 'john@example.com',
      roles: ['user']
    });
    expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith('john@example.com');
  });
});
