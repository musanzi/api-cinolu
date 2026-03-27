import { existsSync, PathLike } from 'fs';
import { ProjectsEmailService } from '@/modules/projects/services/projects-email.service';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn()
}));

describe('ProjectsEmailService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const mailerService = {
      sendMail: jest.fn()
    } as any;
    const service = new ProjectsEmailService(mailerService);
    return { service, mailerService };
  };

  it('sends emails to valid recipients with existing attachments only', async () => {
    const { service, mailerService } = setup();
    const existsSpy = jest.mocked(existsSync).mockImplementation((p: PathLike) => String(p).endsWith('a.pdf'));
    mailerService.sendMail.mockResolvedValue(undefined);

    const recipients = [
      { email: 'a@example.com', name: 'Alice' },
      { email: 'b@example.com', name: 'Bob' }
    ] as any;
    const notification = {
      title: 'Update',
      body: 'Body',
      sender: { name: 'Sender' },
      project: { name: 'Project X' },
      attachments: [{ filename: 'a.pdf' }, { filename: 'missing.pdf' }]
    } as any;

    await expect(service.notifyParticipants(recipients, notification)).resolves.toBeUndefined();
    expect(existsSpy).toHaveBeenCalled();
    expect(mailerService.sendMail).toHaveBeenCalledTimes(2);
    expect(mailerService.sendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'a@example.com',
        attachments: [expect.objectContaining({ filename: 'a.pdf' })]
      })
    );
    expect(mailerService.sendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: 'b@example.com',
        attachments: [expect.objectContaining({ filename: 'a.pdf' })]
      })
    );
  });

  it('sends emails without attachments when files do not exist', async () => {
    const { service, mailerService } = setup();
    jest.mocked(existsSync).mockReturnValue(false);
    mailerService.sendMail.mockResolvedValue(undefined);
    await service.notifyParticipants(
      [{ email: 'a@example.com', name: 'Alice' }] as any,
      { title: 'T', body: 'B', sender: {}, project: { name: 'P' }, attachments: [{ filename: 'x.pdf' }] } as any
    );
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.not.objectContaining({ attachments: expect.anything() })
    );
  });

  it('skips failed sends and continues with next recipient', async () => {
    const { service, mailerService } = setup();
    jest.mocked(existsSync).mockReturnValue(true);
    mailerService.sendMail.mockRejectedValueOnce(new Error('smtp')).mockResolvedValueOnce(undefined);

    await expect(
      service.notifyParticipants(
        [
          { email: 'a@example.com', name: 'Alice' },
          { email: 'b@example.com', name: 'Bob' }
        ] as any,
        { title: 'T', body: 'B', sender: {}, project: { name: 'P' }, attachments: [] } as any
      )
    ).resolves.toBeUndefined();

    expect(mailerService.sendMail).toHaveBeenCalledTimes(2);
    expect(mailerService.sendMail).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: 'a@example.com' }));
    expect(mailerService.sendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: 'b@example.com' }));
  });

  it('sends a participation review email with reviewer message', async () => {
    const { service, mailerService } = setup();
    mailerService.sendMail.mockResolvedValue(undefined);

    await expect(
      service.sendParticipationReview({
        user: { email: 'participant@example.com', name: 'Alice' } as any,
        project: { name: 'Project X' } as any,
        phase: { name: 'Phase 1' } as any,
        score: 82,
        message: 'Bravo pour cette étape',
        nextPhase: { name: 'Phase 2' } as any
      })
    ).resolves.toBeUndefined();

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'participant@example.com',
        subject: 'Project X - Mise à jour de participation'
      })
    );
  });
});
