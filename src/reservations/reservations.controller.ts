import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user.userId, createReservationDto);
  }

  @Get('my')
  findMyReservations(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findMyReservations(user.userId);
  }

  @Get('book/:bookId')
  findQueueForBook(@Param('bookId') bookId: string) {
    return this.reservationsService.findQueueForBook(bookId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.cancel(id, user.userId);
  }
}
