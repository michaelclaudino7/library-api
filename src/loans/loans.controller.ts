import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(user.userId, createLoanDto);
  }

  @Get()
  findAll() {
    return this.loansService.findAll();
  }

  @Get('my')
  findMyLoans(@CurrentUser() user: AuthenticatedUser) {
    return this.loansService.findMyLoans(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Patch(':id/return')
  returnLoan(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.returnLoan(id, user.userId);
  }
}
