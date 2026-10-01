import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Loan, LoanDocument, LoanStatus } from './schemas/loan.schema';
import { CreateLoanDto } from './dto/create-loan.dto';
import { BooksService } from '../books/books.service';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class LoansService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    private booksService: BooksService,
    private configService: ConfigService,
    private reservationsService: ReservationsService,
  ) {}

  async create(userId: string, createLoanDto: CreateLoanDto): Promise<LoanDocument> {
    const book = await this.booksService.findOne(createLoanDto.bookId);

    if (book.availableCopies < 1) {
      throw new BadRequestException('Não há exemplares disponíveis para este livro');
    }

    const activeLoan = await this.loanModel.findOne({
      book: book._id,
      user: userId,
      status: { $in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
    });

    if (activeLoan) {
      throw new BadRequestException('Você já possui um empréstimo ativo deste livro');
    }

    const loanPeriodDays = Number(
      this.configService.get<string>('LOAN_PERIOD_DAYS') ?? 14,
    );

    const loanDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanPeriodDays);

    await this.booksService.update(String(book._id), {
      availableCopies: book.availableCopies - 1,
    } as any);

    const loan = new this.loanModel({
      book: book._id,
      user: new Types.ObjectId(userId),
      loanDate,
      dueDate,
      status: LoanStatus.ACTIVE,
    });

    return loan.save();
  }

  async findAll(): Promise<LoanDocument[]> {
    return this.loanModel.find().populate('book').populate('user', '-password').exec();
  }

  async findMyLoans(userId: string): Promise<LoanDocument[]> {
    return this.loanModel.find({ user: userId }).populate('book').exec();
  }

  async findOne(id: string): Promise<LoanDocument> {
    const loan = await this.loanModel
      .findById(id)
      .populate('book')
      .populate('user', '-password')
      .exec();

    if (!loan) {
      throw new NotFoundException('Empréstimo não encontrado');
    }

    return loan;
  }

  async returnLoan(id: string, userId: string): Promise<LoanDocument> {
    const loan = await this.loanModel.findById(id);

    if (!loan) {
      throw new NotFoundException('Empréstimo não encontrado');
    }

    if (String(loan.user) !== userId) {
      throw new BadRequestException('Este empréstimo não pertence a você');
    }

    if (loan.status === LoanStatus.RETURNED) {
      throw new BadRequestException('Este empréstimo já foi devolvido');
    }

    const returnDate = new Date();
    const fineAmount = this.calculateFine(loan.dueDate, returnDate);

    loan.returnDate = returnDate;
    loan.status = LoanStatus.RETURNED;
    loan.fineAmount = fineAmount;

    const book = await this.booksService.findOne(String(loan.book));
    await this.booksService.update(String(book._id), {
      availableCopies: book.availableCopies + 1,
    } as any);

    await this.reservationsService.activateNextInQueue(String(book._id));

    return loan.save();
  }

  private calculateFine(dueDate: Date, returnDate: Date): number {
    const finePerDay = Number(this.configService.get<string>('FINE_PER_DAY') ?? 1);

    const diffTime = returnDate.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 0;
    }

    return diffDays * finePerDay;
  }
}
