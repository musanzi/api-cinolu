import { BadRequestException } from '@nestjs/common';
import { VenturesEmailService } from '@/modules/ventures/ventures/services/ventures-email.service';

describe('VenturesEmailService', () => {
  const setup = () => {
    const mailerService = { sendMail: jest.fn() } as any;
    const service = new VenturesEmailService(mailerService);
    return { service, mailerService };
  };

  const venture = {
    name: 'Venture X',
    owner: { email: 'owner@example.com', name: 'Owner' }
  } as any;

  it('sends created email', async () => {
    const { service, mailerService } = setup();
    mailerService.sendMail.mockResolvedValue(undefined);
    await expect(service.sendBusinessCreatedEmail(venture)).resolves.toBeUndefined();
    expect(mailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@example.com' }));
  });

  it('sends approval email', async () => {
    const { service, mailerService } = setup();
    mailerService.sendMail.mockResolvedValue(undefined);
    await expect(service.sendVentureApprovalEmail(venture)).resolves.toBeUndefined();
  });

  it('sends rejection email', async () => {
    const { service, mailerService } = setup();
    mailerService.sendMail.mockResolvedValue(undefined);
    await expect(service.sendVentureRejectionEmail(venture)).resolves.toBeUndefined();
  });

  it('wraps mailer errors', async () => {
    const { service, mailerService } = setup();
    mailerService.sendMail.mockRejectedValue(new Error('smtp'));
    await expect(service.sendBusinessCreatedEmail(venture)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.sendVentureApprovalEmail(venture)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.sendVentureRejectionEmail(venture)).rejects.toBeInstanceOf(BadRequestException);
  });
});
