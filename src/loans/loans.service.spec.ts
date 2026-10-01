import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { Loan, LoanStatus } from './schemas/loan.schema';
import { BooksService } from '../books/books.service';
import { ReservationsService } from '../reservations/reservations.service';

describe('LoansService', () => {
  let loansService: LoansService;
  let booksService: BooksService;
  let reservationsService: ReservationsService;

  const mockBook = {
    _id: 'book-id-123',
    title: 'O Senhor dos AnÃ©is',
    availableCopies: 2,
  };

  const mockLoanModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  function MockLoanModelConstructor(this: any, data: any) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue({ ...data, _id: 'loan-id-123' });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: getModelToken(Loan.name),
          useValue: Object.assign(MockLoanModelConstructor, mockLoanModel),
        },
        {
          provide: BooksService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'LOAN_PERIOD_DAYS') return '14';
              if (key === 'FINE_PER_DAY') return '1';
              return null;
            }),
          },
        },
        {
          provide: ReservationsService,
          useValue: {
            activateNextInQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    loansService = module.get<LoansService>(LoansService);
    booksService = module.get<BooksService>(BooksService);
    reservationsService = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(loansService).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um emprÃ©stimo quando hÃ¡ exemplares disponÃ­veis', async () => {
      jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook as any);
      mockLoanModel.findOne.mockResolvedValue(null);
      jest.spyOn(booksService, 'update').mockResolvedValue(mockBook as any);

      const result = await loansService.create('507f1f77bcf86cd799439011', {
        bookId: 'book-id-123',
      });

      expect(booksService.update).toHaveBeenCalledWith('book-id-123', {
        availableCopies: 1,
      });
      expect(result).toBeDefined();
    });

    it('deve lanÃ§ar BadRequestException quando nÃ£o hÃ¡ exemplares disponÃ­veis', async () => {
      jest.spyOn(booksService, 'findOne').mockResolvedValue({
        ...mockBook,
        availableCopies: 0,
      } as any);

      await expect(
        loansService.create('507f1f77bcf86cd799439011', { bookId: 'book-id-123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lanÃ§ar BadRequestException quando o usuÃ¡rio jÃ¡ tem emprÃ©stimo ativo do livro', async () => {
      jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook as any);
      mockLoanModel.findOne.mockResolvedValue({ _id: 'existing-loan' });

      await expect(
        loansService.create('507f1f77bcf86cd799439011', { bookId: 'book-id-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('returnLoan', () => {
    it('deve lanÃ§ar NotFoundException quando o emprÃ©stimo nÃ£o existe', async () => {
      mockLoanModel.findById.mockResolvedValue(null);

      await expect(
        loansService.returnLoan('loan-invalido', '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lanÃ§ar BadRequestException quando o emprÃ©stimo nÃ£o pertence ao usuÃ¡rio', async () => {
      mockLoanModel.findById.mockResolvedValue({
        user: 'outro-user-id',
        status: LoanStatus.ACTIVE,
      });

      await expect(
        loansService.returnLoan('loan-id-123', '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve calcular multa quando a devoluÃ§Ã£o estÃ¡ atrasada', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);

      const mockLoan = {
        _id: 'loan-id-123',
        user: '507f1f77bcf86cd799439011',
        book: 'book-id-123',
        status: LoanStatus.ACTIVE,
        dueDate,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      mockLoanModel.findById.mockResolvedValue(mockLoan);
      jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook as any);
      jest.spyOn(booksService, 'update').mockResolvedValue(mockBook as any);

      const result: any = await loansService.returnLoan(
        'loan-id-123',
        '507f1f77bcf86cd799439011',
      );

      expect(result.fineAmount).toBeGreaterThan(0);
      expect(result.status).toBe(LoanStatus.RETURNED);
      expect(reservationsService.activateNextInQueue).toHaveBeenCalled();
    });

    it('deve devolver sem multa quando estÃ¡ no prazo', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);

      const mockLoan = {
        _id: 'loan-id-123',
        user: '507f1f77bcf86cd799439011',
        book: 'book-id-123',
        status: LoanStatus.ACTIVE,
        dueDate,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      mockLoanModel.findById.mockResolvedValue(mockLoan);
      jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook as any);
      jest.spyOn(booksService, 'update').mockResolvedValue(mockBook as any);

      const result: any = await loansService.returnLoan(
        'loan-id-123',
        '507f1f77bcf86cd799439011',
      );

      expect(result.fineAmount).toBe(0);
    });
  });
});
