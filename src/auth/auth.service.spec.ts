import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUserModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('deve estar definido', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('deve criar um usuário e retornar um token', async () => {
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user-id-123',
        email: registerDto.email,
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);

      const result = await authService.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({ access_token: 'fake-jwt-token' });
    });
  });

  describe('login', () => {
    it('deve retornar um token quando as credenciais são válidas', async () => {
      const loginDto = { email: 'joao@teste.com', password: 'senha123' };
      const hashedPassword = await bcrypt.hash('senha123', 10);

      const mockUser = {
        id: 'user-id-123',
        email: loginDto.email,
        password: hashedPassword,
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);

      const result = await authService.login(loginDto);

      expect(result).toEqual({ access_token: 'fake-jwt-token' });
    });

    it('deve lançar UnauthorizedException quando o usuário não existe', async () => {
      const loginDto = { email: 'naoexiste@teste.com', password: 'senha123' };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando a senha está incorreta', async () => {
      const loginDto = { email: 'joao@teste.com', password: 'senhaerrada' };
      const hashedPassword = await bcrypt.hash('senha123', 10);

      const mockUser = {
        id: 'user-id-123',
        email: loginDto.email,
        password: hashedPassword,
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
