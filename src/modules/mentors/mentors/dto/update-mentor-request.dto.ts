import { PartialType } from '@nestjs/swagger';
import { MentorRequestDto } from './mentor-request.dto';

export class UpdateMentorRequestDto extends PartialType(MentorRequestDto) {}
