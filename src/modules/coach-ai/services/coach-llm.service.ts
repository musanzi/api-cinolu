import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class CoachLlmService {
  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await fetch(process.env.OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:3b',
          stream: true,
          format: 'json',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      if (!response.ok) {
        throw new BadRequestException('Appel IA impossible');
      }
      const payload = (await response.json()) as { message?: { content?: string } };
      if (!payload?.message?.content) {
        throw new BadRequestException('Réponse IA vide');
      }
      return payload.message.content;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Appel IA impossible');
    }
  }
}
