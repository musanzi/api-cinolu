import { BadRequestException, Injectable } from '@nestjs/common';
import { Venture } from '@/modules/ventures/entities/venture.entity';
import { AiCoach } from '../entities/ai-coach.entity';
import { CoachOutput } from '../types/coach-output.type';

@Injectable()
export class CoachOutputValidatorService {
  validate(raw: string, coach: AiCoach, venture: Venture): CoachOutput {
    try {
      const parsed = this.parse(raw);
      this.ensureType(parsed, coach);
      this.ensureFields(parsed);
      this.ensureVentureAwareness(parsed, venture);
      return parsed;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Réponse du coach invalide');
    }
  }

  private parse(raw: string): CoachOutput {
    try {
      return JSON.parse(this.extractJson(raw)) as CoachOutput;
    } catch {
      throw new BadRequestException('Format du coach invalide');
    }
  }

  private extractJson(raw: string): string {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new BadRequestException('Format du coach invalide');
    }
    return trimmed.slice(start, end + 1);
  }

  private ensureType(output: CoachOutput, coach: AiCoach): void {
    if (!coach.expected_outputs.includes(output.type)) {
      throw new BadRequestException('Réponse hors périmètre');
    }
  }

  private ensureFields(output: CoachOutput): void {
    if (!output.title || !output.summary || !output.ventureFocus) {
      throw new BadRequestException('Réponse incomplète');
    }
    if (!Array.isArray(output.bullets) || output.bullets.length === 0) {
      throw new BadRequestException('Réponse incomplète');
    }
    if (!output.scopeCheck?.profile || !output.scopeCheck?.role || output.scopeCheck?.grounded !== true) {
      throw new BadRequestException('Réponse hors périmètre');
    }
  }

  private ensureVentureAwareness(output: CoachOutput, venture: Venture): void {
    const corpus = [output.summary, output.ventureFocus, ...output.bullets].join(' ').toLowerCase();
    const keywords = [venture.name, venture.sector, venture.stage, venture.target_market, venture.problem_solved]
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    if (keywords.length === 0) return;
    const isGrounded = keywords.some((keyword) => corpus.includes(keyword));
    if (!isGrounded) {
      throw new BadRequestException('Réponse non liée à la venture');
    }
  }
}
