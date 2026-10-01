import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanDocument = HydratedDocument<Loan>;

export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
}

@Schema({ timestamps: true })
export class Loan {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  book: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  loanDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: Date, default: null })
  returnDate: Date | null;

  @Prop({ enum: LoanStatus, default: LoanStatus.ACTIVE })
  status: LoanStatus;

  @Prop({ default: 0 })
  fineAmount: number;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
