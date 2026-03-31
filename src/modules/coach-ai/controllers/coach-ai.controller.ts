import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { CreateCoachMessageDto } from '../dto/create-coach-message.dto';
import { CoachAiService } from '../services/coach-ai.service';
import { AiCoach } from '../entities/ai-coach.entity';
import { CoachConversation } from '../entities/coach-conversation.entity';
import { CoachOutput } from '../types/coach-output.type';

@Controller('ventures/:ventureId/coach')
export class CoachAiController {
  constructor(private readonly coachAiService: CoachAiService) {}

  @Get()
  findCoach(@Param('ventureId') ventureId: string, @CurrentUser() user: User): Promise<AiCoach> {
    return this.coachAiService.findCoachForVenture(ventureId, user);
  }

  @Get('conversation')
  findConversation(@Param('ventureId') ventureId: string, @CurrentUser() user: User): Promise<CoachConversation> {
    return this.coachAiService.findConversation(ventureId, user);
  }

  @Post('messages')
  chat(
    @Param('ventureId') ventureId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCoachMessageDto
  ): Promise<CoachOutput> {
    return this.coachAiService.chat(ventureId, user, dto);
  }
}
