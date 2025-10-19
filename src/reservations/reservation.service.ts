import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, MoreThan, MoreThanOrEqual, LessThan, LessThanOrEqual, Not } from 'typeorm';
import { CreateReservationDto } from '../dtos/create-reservation.dto';
import { UpdateReservationDto } from '../dtos/update-reservation.dto';
import { PatchReservationDto } from '../dtos/patch-reservation.dto';
import { QueryReservationDto } from '../dtos/query-reservation.dto';
import { Reservation } from '../entities/reservation.entity';
import { AuthorizedUser } from '../entities/authorized-user.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(AuthorizedUser)
    private authorizedUserRepo: Repository<AuthorizedUser>,
  ) {}

  async create(createReservationDto: CreateReservationDto) {
    const reservation = this.reservationRepo.create({
      ...createReservationDto,
      authorizedUsers: createReservationDto.authorizedUsers?.map((au) => this.authorizedUserRepo.create(au)),
    });
    await this.reservationRepo.save(reservation);
    return reservation;
  }

  async findAll(query: QueryReservationDto) {
    const where: FindOptionsWhere<Reservation> = {};
    
    for (const [key, value] of Object.entries(query as Record<string, string>)) {
      if (!value) continue;

      if (typeof value === 'string' && value.startsWith('{')) {
        const match = value.match(/^\{(\w+)\}(.*)$/);
        if (match) {
          const [, operator, rawValue] = match;
          const parsedValue = this.parseValue(key, rawValue);

          switch (operator) {
            case 'neq':
              where[key] = Not(parsedValue);
              break;
            case 'gt':
              where[key] = MoreThan(parsedValue);
              break;
            case 'gteq':
              where[key] = MoreThanOrEqual(parsedValue);
              break;
            case 'lt':
              where[key] = LessThan(parsedValue);
              break;
            case 'lteq':
              where[key] = LessThanOrEqual(parsedValue);
              break;
            case 'like':
              // Remove % from the start/end as ILike handles the pattern matching
              const cleanValue = rawValue.replace(/^%|%$/g, '');
              where[key] = ILike(`%${cleanValue}%`);
              break;
          }
        }
      } else {
        // No operator - use equals with parsed value
        where[key] = this.parseValue(key, value);
      }
    }

    return this.reservationRepo.find({ 
      where,
      relations: ['authorizedUsers'] // Include related entities if needed
    });
  }

  async findOne(id: string) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    Object.assign(reservation, updateReservationDto);
    await this.reservationRepo.save(reservation);
    return reservation;
  }

  async patch(id: string, patchReservationDto: PatchReservationDto) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    Object.assign(reservation, patchReservationDto);
    await this.reservationRepo.save(reservation);
    return reservation;
  }

  async remove(id: string) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    await this.reservationRepo.remove(reservation);
    return { message: 'Reserva removida' };
  }

  private parseValue(key: string, value: string) {
    switch (key) {
      case 'initial_date':
      case 'final_date':
        return new Date(value);
      case 'quantity':
      case 'duration':
        return parseFloat(value);
      case 'reservation_id':
      case 'room_id':
      case 'user_id':
        return value; // Keep as string for IDs
      case 'status':
      case 'description':
      case 'title':
        return value; // Keep as string for text fields
      default:
        return value;
    }
  }
}
