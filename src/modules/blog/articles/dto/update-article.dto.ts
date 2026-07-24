import { CreateArticleDto } from './create-article.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
