import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CoachAiService } from '@/modules/coach-ai/services/coach-ai.service';

describe('CoachAiService', () => {
  const setup = () => {
    const venturesService = {
      findOne: jest.fn()
    } as any;
    const coachStoreService = {
      findByVenture: jest.fn(),
      findByVentureOrFail: jest.fn(),
      create: jest.fn()
    } as any;
    const conversationsService = {
      findByCoachAndVenture: jest.fn(),
      findByCoachAndVentureOrFail: jest.fn(),
      create: jest.fn()
    } as any;
    const messagesService = {
      findByConversation: jest.fn(),
      createUserMessage: jest.fn(),
      createCoachMessage: jest.fn()
    } as any;
    const configService = {
      buildDefinition: jest.fn()
    } as any;
    const diagnosticWorkflow = {
      run: jest.fn()
    } as any;
    const conversationWorkflow = {
      run: jest.fn()
    } as any;

    const service = new CoachAiService(
      venturesService,
      coachStoreService,
      conversationsService,
      messagesService,
      configService,
      diagnosticWorkflow,
      conversationWorkflow
    );

    return {
      service,
      venturesService,
      coachStoreService,
      conversationsService,
      messagesService,
      configService,
      diagnosticWorkflow,
      conversationWorkflow
    };
  };

  it('assigns a coach and saves the initial diagnostic', async () => {
    const { service, coachStoreService, conversationsService, configService, diagnosticWorkflow, messagesService } = setup();
    coachStoreService.findByVenture.mockResolvedValue(null);
    configService.buildDefinition.mockReturnValue({
      name: 'Coach diagnostic AgriNova',
      profile: 'Coach',
      role: 'Diagnostic',
      expectedOutputs: ['DIAGNOSTIC']
    });
    coachStoreService.create.mockResolvedValueOnce({ id: 'c1', venture: { id: 'v1' } });
    conversationsService.findByCoachAndVenture.mockResolvedValue(null);
    conversationsService.create.mockResolvedValue({ id: 'conv1' });
    diagnosticWorkflow.run.mockResolvedValue({
      type: 'DIAGNOSTIC',
      title: 'Diagnostic',
      summary: 'Resume',
      bullets: ['Action'],
      ventureFocus: 'AgriNova',
      scopeCheck: { profile: 'Coach', role: 'Diagnostic', grounded: true }
    });
    coachStoreService.findByVentureOrFail.mockResolvedValue({ id: 'c1', venture: { id: 'v1' } });
    messagesService.createCoachMessage.mockResolvedValue(undefined);

    await expect(service.assignCoachToVenture({ id: 'v1', name: 'AgriNova' } as any)).resolves.toEqual({
      id: 'c1',
      venture: { id: 'v1' }
    });
    expect(messagesService.createCoachMessage).toHaveBeenCalledWith(
      'conv1',
      expect.objectContaining({ type: 'DIAGNOSTIC' })
    );
  });

  it('returns existing coach without recreating it', async () => {
    const { service, coachStoreService } = setup();
    coachStoreService.findByVenture.mockResolvedValue({ id: 'c1' });

    await expect(service.assignCoachToVenture({ id: 'v1' } as any)).resolves.toEqual({ id: 'c1' });
  });

  it('saves user and coach messages during chat', async () => {
    const { service, venturesService, coachStoreService, conversationsService, messagesService, conversationWorkflow } =
      setup();
    venturesService.findOne.mockResolvedValue({ id: 'v1', owner: { id: 'u1' }, name: 'AgriNova' });
    coachStoreService.findByVentureOrFail.mockResolvedValue({
      id: 'c1',
      expected_outputs: ['CLARIFICATION'],
      venture: { id: 'v1' }
    });
    conversationsService.findByCoachAndVenture.mockResolvedValue({ id: 'conv1' });
    messagesService.findByConversation.mockResolvedValue([{ role: 'assistant', content: 'old' }]);
    messagesService.createUserMessage.mockResolvedValue(undefined);
    messagesService.createCoachMessage.mockResolvedValue(undefined);
    conversationWorkflow.run.mockResolvedValue({
      type: 'CLARIFICATION',
      title: 'Clarification',
      summary: 'Precise la traction de AgriNova',
      bullets: ['Indique le nombre de clients.'],
      ventureFocus: 'AgriNova',
      scopeCheck: { profile: 'Coach', role: 'Diagnostic', grounded: true }
    });

    await expect(service.chat('v1', { id: 'u1' } as any, { message: 'Que faire ?' })).resolves.toEqual(
      expect.objectContaining({ type: 'CLARIFICATION' })
    );
    expect(messagesService.createUserMessage).toHaveBeenCalledWith('conv1', 'Que faire ?');
    expect(messagesService.createCoachMessage).toHaveBeenCalledWith(
      'conv1',
      expect.objectContaining({ type: 'CLARIFICATION' })
    );
  });

  it('rejects chat when the user does not own the venture', async () => {
    const { service, venturesService } = setup();
    venturesService.findOne.mockResolvedValue({ id: 'v1', owner: { id: 'u2' } });

    await expect(service.chat('v1', { id: 'u1' } as any, { message: 'Que faire ?' })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('throws when the coach is missing for a venture lookup', async () => {
    const { service, venturesService, coachStoreService } = setup();
    venturesService.findOne.mockResolvedValue({ id: 'v1', owner: { id: 'u1' } });
    coachStoreService.findByVentureOrFail.mockRejectedValue(new NotFoundException('Coach introuvable'));

    await expect(service.findCoachForVenture('v1', { id: 'u1' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });
});
