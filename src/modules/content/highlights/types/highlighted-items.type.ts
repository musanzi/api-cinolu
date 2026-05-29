import { Article } from '../../blog/articles/entities/article.entity';
import { Event } from '../../../events/events/entities/event.entity';
import { Program } from '../../../programs/programs/entities/program.entity';
import { Project } from '../../../projects/projects/entities/project.entity';
import { Subprogram } from '../../../programs/subprograms/entities/subprogram.entity';

export interface HighlightedItems {
  programs: Program[];
  subprograms: Subprogram[];
  events: Event[];
  projects: Project[];
  articles: Article[];
}
