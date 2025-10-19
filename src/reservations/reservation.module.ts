import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { AuthorizedUserController } from '../authorized-user/authorized-user.controller';
import { AuthorizedUserService } from '../authorized-user/authorized-user.service';
import { Reservation } from '../entities/reservation.entity';
import { AuthorizedUser } from '../entities/authorized-user.entity';
import { AuthGuard } from '../guards/auth.guard';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, AuthorizedUser]), HttpModule],
  controllers: [ReservationController, AuthorizedUserController],
  providers: [ReservationService, AuthorizedUserService, AuthGuard],
})
export class ReservationModule {}
