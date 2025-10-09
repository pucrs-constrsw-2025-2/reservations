import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { AuthorizedUserController } from './authorized-user.controller';
import { AuthorizedUserService } from './authorized-user.service';
import { Reservation } from './entities/reservation.entity';
import { AuthorizedUser } from './entities/authorized-user.entity';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, AuthorizedUser]),
    HttpModule,
  ],
  controllers: [ReservationController, AuthorizedUserController],
  providers: [ReservationService, AuthorizedUserService, AuthGuard],
})
export class ReservationModule {}
