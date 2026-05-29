import { MentorRequestDto } from './mentor-request.dto';
import { IsEmail } from 'class-validator';

export class CreateMentorDto {
  @IsEmail()
  email: string;

  mentor: MentorRequestDto;
}
