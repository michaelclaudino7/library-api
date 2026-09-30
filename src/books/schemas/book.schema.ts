import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  author: string;

  @Prop({ required: true, unique: true, trim: true })
  isbn: string;

  @Prop({ trim: true })
  category: string;

  @Prop({ required: true, min: 0 })
  totalCopies: number;

  @Prop({ required: true, min: 0 })
  availableCopies: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);