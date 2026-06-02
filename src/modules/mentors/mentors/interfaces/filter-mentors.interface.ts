import { MentorStatus } from '../enums/mentor.enum';

export interface FilterMentorsInterface {
  page?: string;
  q?: string;
  status?: MentorStatus;
}
