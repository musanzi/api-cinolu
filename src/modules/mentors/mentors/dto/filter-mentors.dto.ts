import { MentorStatus } from '../enums/mentor.enum';

export interface FilterMentorsDto {
  page: string | null;
  q: string | null;
  status: MentorStatus | null;
}
