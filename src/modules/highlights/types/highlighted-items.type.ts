import { Article } from '../../blog/articles/entities/article.entity';
import { Event } from '@/modules/events/events/entities/event.entity';
import { Program } from '@/modules/programs/programs/entities/program.entity';
import { Project } from '@/modules/projects/projects/entities/project.entity';
import { Subprogram } from '@/modules/programs/subprograms/entities/subprogram.entity';

export interface HighlightedItems {
  programs: Program[];
  subprograms: Subprogram[];
  events: Event[];
  projects: Project[];
  articles: Article[];
}
