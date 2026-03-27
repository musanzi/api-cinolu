import { BadRequestException } from '@nestjs/common';
import { ProjectParticipationReviewService } from '@/modules/projects/services/project-participation-review.service';

describe('ProjectParticipationReviewService', () => {
  const setup = () => {
    const reviewRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn()
    } as any;
    const participationService = {
      findOne: jest.fn(),
      findManyForPhaseTransition: jest.fn(),
      saveMany: jest.fn()
    } as any;
    const phasesService = {
      findOne: jest.fn()
    } as any;
    const eventEmitter = {
      emit: jest.fn()
    } as any;
    const service = new ProjectParticipationReviewService(
      reviewRepository,
      participationService,
      phasesService,
      eventEmitter
    );
    return { service, reviewRepository, participationService, phasesService, eventEmitter };
  };

  it('sets a phase score', async () => {
    const { service, reviewRepository, participationService, phasesService, eventEmitter } = setup();
    participationService.findOne.mockResolvedValue({
      id: 'pp1',
      phases: [{ id: 'phase-1' }],
      user: { id: 'u1', email: 'participant@example.com', name: 'Participant' },
      project: {
        id: 'project-1',
        name: 'Project 1',
        phases: [
          { id: 'phase-1', name: 'Phase 1', started_at: new Date('2026-01-01') },
          { id: 'phase-2', name: 'Phase 2', started_at: new Date('2026-02-01') }
        ]
      }
    });
    phasesService.findOne.mockResolvedValue({ id: 'phase-1', name: 'Phase 1' });
    reviewRepository.findOne.mockResolvedValue(null);
    reviewRepository.save.mockResolvedValue({ id: 'r1', score: 80, message: 'Bien joué' });
    participationService.saveMany.mockResolvedValue(undefined);

    await expect(
      service.review('pp1', {
        phaseId: 'phase-1',
        score: 80,
        message: 'Bien joué',
        notifyParticipant: true
      } as any)
    ).resolves.toEqual({
      id: 'r1',
      score: 80,
      message: 'Bien joué'
    });
    expect(reviewRepository.save).toHaveBeenCalledWith({
      id: undefined,
      participation: { id: 'pp1' },
      phase: { id: 'phase-1' },
      message: 'Bien joué',
      score: 80
    });
    expect(participationService.saveMany).toHaveBeenCalledWith([
      expect.objectContaining({
        phases: [expect.objectContaining({ id: 'phase-1' }), expect.objectContaining({ id: 'phase-2' })]
      })
    ]);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'participation.review',
      expect.objectContaining({
        user: expect.objectContaining({ email: 'participant@example.com' }),
        project: expect.objectContaining({ id: 'project-1' }),
        phase: expect.objectContaining({ id: 'phase-1' }),
        score: 80,
        message: 'Bien joué',
        nextPhase: expect.objectContaining({ id: 'phase-2' })
      })
    );
  });

  it('updates an existing phase score', async () => {
    const { service, reviewRepository, participationService, phasesService, eventEmitter } = setup();
    participationService.findOne.mockResolvedValue({
      id: 'pp1',
      phases: [{ id: 'phase-1' }],
      project: { phases: [{ id: 'phase-1', started_at: new Date('2026-01-01') }] }
    });
    phasesService.findOne.mockResolvedValue({ id: 'phase-1' });
    reviewRepository.findOne.mockResolvedValue({ id: 'r1' });
    reviewRepository.save.mockResolvedValue({ id: 'r1', score: 95, message: null });

    await expect(service.review('pp1', { phaseId: 'phase-1', score: 95 } as any)).resolves.toEqual({
      id: 'r1',
      score: 95,
      message: null
    });
    expect(reviewRepository.save).toHaveBeenCalledWith({
      id: 'r1',
      participation: { id: 'pp1' },
      phase: { id: 'phase-1' },
      message: null,
      score: 95
    });
    expect(participationService.saveMany).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rejects score update when participation is outside the phase', async () => {
    const { service, participationService, phasesService } = setup();
    participationService.findOne.mockResolvedValue({
      id: 'pp1',
      phases: [{ id: 'phase-2' }],
      project: { phases: [{ id: 'phase-1', started_at: new Date('2026-01-01') }] }
    });
    phasesService.findOne.mockResolvedValue({ id: 'phase-1' });

    await expect(service.review('pp1', { phaseId: 'phase-1', score: 50 } as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('does not auto promote when score is below the threshold', async () => {
    const { service, reviewRepository, participationService, phasesService, eventEmitter } = setup();
    participationService.findOne.mockResolvedValue({
      id: 'pp1',
      phases: [{ id: 'phase-1' }],
      user: { id: 'u1', email: 'participant@example.com', name: 'Participant' },
      project: {
        id: 'project-1',
        name: 'Project 1',
        phases: [
          { id: 'phase-1', name: 'Phase 1', started_at: new Date('2026-01-01') },
          { id: 'phase-2', name: 'Phase 2', started_at: new Date('2026-02-01') }
        ]
      }
    });
    phasesService.findOne.mockResolvedValue({ id: 'phase-1', name: 'Phase 1' });
    reviewRepository.findOne.mockResolvedValue(null);
    reviewRepository.save.mockResolvedValue({ id: 'r1', score: 59, message: 'Continue' });

    await expect(
      service.review('pp1', {
        phaseId: 'phase-1',
        score: 59,
        message: 'Continue',
        notifyParticipant: true
      } as any)
    ).resolves.toEqual({
      id: 'r1',
      score: 59,
      message: 'Continue'
    });
    expect(reviewRepository.save).toHaveBeenCalledWith({
      id: undefined,
      participation: { id: 'pp1' },
      phase: { id: 'phase-1' },
      message: 'Continue',
      score: 59
    });
    expect(participationService.saveMany).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'participation.review',
      expect.objectContaining({
        user: expect.objectContaining({ email: 'participant@example.com' }),
        project: expect.objectContaining({ id: 'project-1' }),
        phase: expect.objectContaining({ id: 'phase-1' }),
        score: 59,
        message: 'Continue',
        nextPhase: null
      })
    );
  });
});
