import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateArticleDto {
  @IsOptional()
  published_at: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: string;

  @IsArray()
  tags: string[];
}
