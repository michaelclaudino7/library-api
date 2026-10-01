import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

export enum ReservationStatus {
  WAITING = 'waiting',
  AVAILABLE = 'available',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  book: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ enum: ReservationStatus, default: ReservationStatus.WAITING })
  status: ReservationStatus;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
