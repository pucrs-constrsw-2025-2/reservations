import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizedUser } from '../entities/authorized-user.entity';
import { Reservation } from '../entities/reservation.entity';
import { CreateAuthorizedUserDto, UpdateAuthorizedUserDto, PatchAuthorizedUserDto } from '../dtos/authorized-user.dto';

@Injectable()
export class AuthorizedUserService {
  constructor(
    @InjectRepository(AuthorizedUser)
    private authorizedUserRepo: Repository<AuthorizedUser>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  async addToReservation(reservationId: string, createAuthorizedUserDto: CreateAuthorizedUserDto) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: reservationId, deleted: false } });
    if (!reservation) {
      throw new NotFoundException(`Reserva com ID ${reservationId} não encontrada`);
    }

    const authorizedUser = this.authorizedUserRepo.create({
      ...createAuthorizedUserDto,
      deleted: false,
      reservation,
    });

    return await this.authorizedUserRepo.save(authorizedUser);
  }

  async findByReservation(reservationId: string) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: reservationId, deleted: false } });
    if (!reservation) {
      throw new NotFoundException(`Reserva com ID ${reservationId} não encontrada`);
    }

    return await this.authorizedUserRepo.find({
      where: { reservation: { reservation_id: reservationId }, deleted: false },
    });
  }

  async findOne(reservationId: string, userId: string) {
    const authorizedUser = await this.authorizedUserRepo.findOne({
      where: { 
        authorized_user_id: userId,
        reservation: { reservation_id: reservationId, deleted: false },
        deleted: false,
      },
      relations: ['reservation'],
    });

    if (!authorizedUser) {
      throw new NotFoundException(`Usuário autorizado com ID ${userId} não encontrado na reserva ${reservationId}`);
    }

    return authorizedUser;
  }

  async update(reservationId: string, userId: string, updateAuthorizedUserDto: UpdateAuthorizedUserDto) {
    const authorizedUser = await this.findOne(reservationId, userId);
    
    Object.assign(authorizedUser, updateAuthorizedUserDto);
    return await this.authorizedUserRepo.save(authorizedUser);
  }

  async patch(reservationId: string, userId: string, patchAuthorizedUserDto: PatchAuthorizedUserDto) {
    const authorizedUser = await this.findOne(reservationId, userId);
    
    Object.assign(authorizedUser, patchAuthorizedUserDto);
    return await this.authorizedUserRepo.save(authorizedUser);
  }

  async remove(reservationId: string, userId: string) {
    const authorizedUser = await this.findOne(reservationId, userId);
    authorizedUser.deleted = true;
    await this.authorizedUserRepo.save(authorizedUser);
    return { message: 'Usuário autorizado removido' };
  }
}