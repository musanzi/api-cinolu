import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  articleId: string;

  @IsNotEmpty()
  content: string;
}
