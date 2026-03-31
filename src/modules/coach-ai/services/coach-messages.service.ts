import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoachMessage } from '../entities/coach-message.entity';
import { CoachOutput } from '../types/coach-output.type';

@Injectable()
export class CoachMessagesService {
  constructor(
    @InjectRepository(CoachMessage)
    private readonly messageRepository: Repository<CoachMessage>
  ) {}

  async findByConversation(conversationId: string): Promise<CoachMessage[]> {
    try {
      return await this.messageRepository.find({
        where: { conversation: { id: conversationId } },
        order: { created_at: 'ASC' }
      });
    } catch {
      throw new BadRequestException('Historique introuvable');
    }
  }

  async createUserMessage(conversationId: string, message: string): Promise<void> {
    try {
      await this.messageRepository.save({
        role: 'user',
        output_type: 'USER_MESSAGE',
        content: message,
        payload: { message },
        conversation: { id: conversationId }
      });
    } catch {
      throw new BadRequestException('Message utilisateur impossible');
    }
  }

  async createCoachMessage(conversationId: string, output: CoachOutput): Promise<void> {
    try {
      await this.messageRepository.save({
        role: 'assistant',
        output_type: output.type,
        content: output.summary,
        payload: output,
        conversation: { id: conversationId }
      });
    } catch {
      throw new BadRequestException('Message du coach impossible');
    }
  }
}
