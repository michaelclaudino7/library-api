import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './schemas/book.schema';

describe('BooksService', () => {
  let booksService: BooksService;

  const mockBook = {
    _id: 'book-id-123',
    title: 'O Senhor dos Anéis',
    author: 'J.R.R. Tolkien',
    isbn: '978-8595084759',
    category: 'Fantasia',
    totalCopies: 3,
    availableCopies: 3,
  };

  const mockBookModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  function MockBookModelConstructor(this: any, data: any) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue({ ...mockBook, ...data });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getModelToken(Book.name),
          useValue: Object.assign(MockBookModelConstructor, mockBookModel),
        },
      ],
    }).compile();

    booksService = module.get<BooksService>(BooksService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(booksService).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um livro com availableCopies igual a totalCopies', async () => {
      const createBookDto = {
        title: 'O Senhor dos Anéis',
        author: 'J.R.R. Tolkien',
        isbn: '978-8595084759',
        category: 'Fantasia',
        totalCopies: 3,
      };

      mockBookModel.findOne.mockResolvedValue(null);

      const result = await booksService.create(createBookDto);

      expect(result.availableCopies).toBe(3);
    });

    it('deve lançar ConflictException quando o ISBN já existe', async () => {
      const createBookDto = {
        title: 'Livro Duplicado',
        author: 'Autor',
        isbn: '978-8595084759',
        totalCopies: 1,
      };

      mockBookModel.findOne.mockResolvedValue(mockBook);

      await expect(booksService.create(createBookDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar um livro quando encontrado', async () => {
      mockBookModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBook),
      });

      const result = await booksService.findOne('book-id-123');

      expect(result).toEqual(mockBook);
    });

    it('deve lançar NotFoundException quando o livro não existe', async () => {
      mockBookModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(booksService.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve lançar NotFoundException ao remover livro inexistente', async () => {
      mockBookModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(booksService.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
