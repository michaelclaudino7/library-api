import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './schemas/reservation.schema';
import { BooksService } from '../books/books.service';

describe('ReservationsService', () => {
  let reservationsService: ReservationsService;
  let booksService: BooksService;

  const userId = '507f1f77bcf86cd799439011';

  const mockBookAvailable = {
    _id: 'book-id-123',
    availableCopies: 2,
  };

  const mockBookUnavailable = {
    _id: 'book-id-123',
    availableCopies: 0,
  };

  const mockReservationModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  function MockReservationModelConstructor(this: any, data: any) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue({ ...data, _id: 'reservation-id-123' });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: Object.assign(
            MockReservationModelConstructor,
            mockReservationModel,
          ),
        },
        {
          provide: BooksService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    reservationsService = module.get<ReservationsService>(ReservationsService);
    booksService = module.get<BooksService>(BooksService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(reservationsService).toBeDefined();
  });

  describe('create', () => {
    it('deve lançar BadRequestException quando o livro tem exemplares disponíveis', async () => {
      jest
        .spyOn(booksService, 'findOne')
        .mockResolvedValue(mockBookAvailable as any);

      await expect(
        reservationsService.create(userId, { bookId: 'book-id-123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar uma reserva quando o livro está indisponível', async () => {
      jest
        .spyOn(booksService, 'findOne')
        .mockResolvedValue(mockBookUnavailable as any);
      mockReservationModel.findOne.mockResolvedValue(null);

      const result = await reservationsService.create(userId, {
        bookId: 'book-id-123',
      });

      expect(result).toBeDefined();
      expect((result as any).status).toBe(ReservationStatus.WAITING);
    });

    it('deve lançar BadRequestException quando o usuário já tem reserva ativa', async () => {
      jest
        .spyOn(booksService, 'findOne')
        .mockResolvedValue(mockBookUnavailable as any);
      mockReservationModel.findOne.mockResolvedValue({
        _id: 'existing-reservation',
      });

      await expect(
        reservationsService.create(userId, { bookId: 'book-id-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('activateNextInQueue', () => {
    it('deve ativar a próxima reserva da fila quando existir', async () => {
      const mockNextReservation = {
        status: ReservationStatus.WAITING,
        save: jest.fn().mockResolvedValue(true),
      };

      mockReservationModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockNextReservation),
      });

      await reservationsService.activateNextInQueue('book-id-123');

      expect(mockNextReservation.status).toBe(ReservationStatus.AVAILABLE);
      expect(mockNextReservation.save).toHaveBeenCalled();
    });

    it('não deve fazer nada quando não há reserva na fila', async () => {
      mockReservationModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      await expect(
        reservationsService.activateNextInQueue('book-id-123'),
      ).resolves.not.toThrow();
    });
  });

  describe('cancel', () => {
    it('deve lançar BadRequestException quando a reserva não pertence ao usuário', async () => {
      mockReservationModel.findById.mockResolvedValue({
        user: 'outro-user-id',
        status: ReservationStatus.WAITING,
      });

      await expect(
        reservationsService.cancel('reservation-id-123', userId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
