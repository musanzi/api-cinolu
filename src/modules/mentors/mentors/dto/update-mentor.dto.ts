import { PartialType } from '@nestjs/swagger';
import { MentorRequestDto } from './mentor-request.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';

class UpdateMentorProfileDto extends PartialType(MentorRequestDto) {}

export class UpdateMentorDto {
  user?: UpdateUserDto;
  mentor?: UpdateMentorProfileDto;
}
