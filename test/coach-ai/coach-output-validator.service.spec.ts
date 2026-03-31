import { BadRequestException } from '@nestjs/common';
import { CoachOutputValidatorService } from '@/modules/coach-ai/services/coach-output-validator.service';

describe('CoachOutputValidatorService', () => {
  const service = new CoachOutputValidatorService();
  const coach = {
    expected_outputs: ['DIAGNOSTIC', 'CLARIFICATION']
  } as any;
  const venture = {
    name: 'AgriNova',
    sector: 'agritech',
    stage: 'seed',
    target_market: 'small farmers',
    problem_solved: 'post-harvest losses'
  } as any;

  it('accepts a grounded and allowed coach output', () => {
    const raw = JSON.stringify({
      type: 'DIAGNOSTIC',
      title: 'Diagnostic initial',
      summary: 'AgriNova en agritech au stade seed doit clarifier son offre.',
      bullets: ['Le marche des small farmers est prioritaire.'],
      ventureFocus: 'AgriNova doit reduire les post-harvest losses.',
      scopeCheck: {
        profile: 'Coach stratégique',
        role: 'Diagnostic',
        grounded: true
      }
    });

    expect(service.validate(raw, coach, venture)).toEqual(expect.objectContaining({ type: 'DIAGNOSTIC' }));
  });

  it('rejects outputs outside the expected types', () => {
    const raw = JSON.stringify({
      type: 'FORECAST',
      title: 'Hors scope',
      summary: 'AgriNova',
      bullets: ['AgriNova'],
      ventureFocus: 'AgriNova',
      scopeCheck: {
        profile: 'Coach stratégique',
        role: 'Diagnostic',
        grounded: true
      }
    });

    expect(() => service.validate(raw, coach, venture)).toThrow(BadRequestException);
  });

  it('rejects outputs not grounded in the venture', () => {
    const raw = JSON.stringify({
      type: 'DIAGNOSTIC',
      title: 'Diagnostic initial',
      summary: 'Startup generale sans contexte.',
      bullets: ['Aucune reference utile.'],
      ventureFocus: 'Sans lien metier.',
      scopeCheck: {
        profile: 'Coach stratégique',
        role: 'Diagnostic',
        grounded: true
      }
    });

    expect(() => service.validate(raw, coach, venture)).toThrow(BadRequestException);
  });
});
