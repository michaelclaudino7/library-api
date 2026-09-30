import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'O autor é obrigatório' })
  @IsString()
  author: string;

  @IsNotEmpty({ message: 'O ISBN é obrigatório' })
  @IsString()
  isbn: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsInt({ message: 'A quantidade total deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade total deve ser no mínimo 1' })
  totalCopies: number;
}