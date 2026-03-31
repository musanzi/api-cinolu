import { CoachConfigService } from '@/modules/coach-ai/services/coach-config.service';

describe('CoachConfigService', () => {
  it('builds a scoped coach definition from a venture', () => {
    const service = new CoachConfigService();

    const definition = service.buildDefinition({
      name: 'AgriNova',
      sector: 'agritech',
      stage: 'seed'
    } as any);

    expect(definition.name).toContain('AgriNova');
    expect(definition.profile).toContain('agritech');
    expect(definition.role).toContain('seed');
    expect(definition.expectedOutputs).toEqual(
      expect.arrayContaining(['DIAGNOSTIC', 'RECOMMENDATIONS', 'RISKS', 'NEXT_ACTIONS', 'CLARIFICATION'])
    );
  });
});
