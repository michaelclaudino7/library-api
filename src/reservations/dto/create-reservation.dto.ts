import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateReservationDto {
  @IsNotEmpty({ message: 'O ID do livro é obrigatório' })
  @IsMongoId({ message: 'ID de livro inválido' })
  bookId: string;
}
