import { BadRequestException } from '@nestjs/common';
import { EventParticipationService } from '@/modules/events/events/services/event-participation.service';

describe('EventParticipationService', () => {
  const setup = () => {
    const participationRepository = {
      findOne: jest.fn(),
      save: jest.fn()
    } as any;
    const eventRepository = {
      findOneOrFail: jest.fn()
    } as any;
    const eventsService = {
      findOne: jest.fn()
    } as any;
    const service = new EventParticipationService(participationRepository, eventRepository, eventsService);
    return { service, participationRepository, eventRepository, eventsService };
  };

  it('participates in event and returns refreshed event', async () => {
    const { service, participationRepository, eventsService, eventRepository } = setup();
    participationRepository.findOne.mockResolvedValue(null);
    eventsService.findOne.mockResolvedValue({ id: 'e1' });
    participationRepository.save.mockResolvedValue(undefined);
    eventRepository.findOneOrFail.mockResolvedValue({ id: 'e1', participations: [{ user: { id: 'u1' } }] });

    await expect(service.participate('e1', 'u1')).resolves.toEqual({
      id: 'e1',
      participations: [{ user: { id: 'u1' } }]
    });
  });

  it('throws when user already participates', async () => {
    const { service, participationRepository } = setup();
    participationRepository.findOne.mockResolvedValue({ id: 'existing' });
    await expect(service.participate('e1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates errors when event lookup fails', async () => {
    const { service, participationRepository, eventsService } = setup();
    participationRepository.findOne.mockResolvedValue(null);
    eventsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.participate('e1', 'u1')).rejects.toThrow('bad');
  });
});
