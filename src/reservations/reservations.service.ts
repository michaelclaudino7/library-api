import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Reservation,
  ReservationDocument,
  ReservationStatus,
} from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { BooksService } from '../books/books.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    private booksService: BooksService,
  ) {}

  async create(
    userId: string,
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationDocument> {
    const book = await this.booksService.findOne(createReservationDto.bookId);

    if (book.availableCopies > 0) {
      throw new BadRequestException(
        'Este livro possui exemplares disponíveis, faça o empréstimo diretamente',
      );
    }

    const existingReservation = await this.reservationModel.findOne({
      book: book._id,
      user: userId,
      status: { $in: [ReservationStatus.WAITING, ReservationStatus.AVAILABLE] },
    });

    if (existingReservation) {
      throw new BadRequestException('Você já possui uma reserva ativa para este livro');
    }

    const reservation = new this.reservationModel({
      book: book._id,
      user: new Types.ObjectId(userId),
      status: ReservationStatus.WAITING,
    });

    return reservation.save();
  }

  async findMyReservations(userId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({ user: userId })
      .populate('book')
      .sort({ createdAt: 1 })
      .exec();
  }

  async findQueueForBook(bookId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({
        book: bookId,
        status: { $in: [ReservationStatus.WAITING, ReservationStatus.AVAILABLE] },
      })
      .populate('user', '-password')
      .sort({ createdAt: 1 })
      .exec();
  }

  async cancel(id: string, userId: string): Promise<ReservationDocument> {
    const reservation = await this.reservationModel.findById(id);

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (String(reservation.user) !== userId) {
      throw new BadRequestException('Esta reserva não pertence a você');
    }

    reservation.status = ReservationStatus.CANCELLED;
    return reservation.save();
  }

  async activateNextInQueue(bookId: string): Promise<void> {
    const nextReservation = await this.reservationModel
      .findOne({ book: bookId, status: ReservationStatus.WAITING })
      .sort({ createdAt: 1 });

    if (nextReservation) {
      nextReservation.status = ReservationStatus.AVAILABLE;
      await nextReservation.save();
    }
  }
}
