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
      deleted: false,
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

    // Default: only active (not deleted) unless explicitly filtered
    if (typeof (query as any).deleted === 'undefined') {
      (where as any).deleted = false;
    }

    return this.reservationRepo.find({ 
      where,
      relations: ['authorizedUsers'] // Include related entities if needed
    });
  }

  async findOne(id: string) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id, deleted: false } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id, deleted: false } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    Object.assign(reservation, updateReservationDto);
    if (typeof (reservation as any).deleted === 'undefined') {
      (reservation as any).deleted = false;
    }
    await this.reservationRepo.save(reservation);
    return reservation;
  }

  async patch(id: string, patchReservationDto: PatchReservationDto) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id, deleted: false } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    Object.assign(reservation, patchReservationDto);
    if (typeof (reservation as any).deleted === 'undefined') {
      (reservation as any).deleted = false;
    }
    await this.reservationRepo.save(reservation);
    return reservation;
  }

  async remove(id: string) {
    const reservation = await this.reservationRepo.findOne({ where: { reservation_id: id, deleted: false } });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');
    reservation.deleted = true;
    await this.reservationRepo.save(reservation);
    return { message: 'Reserva removida' };
  }

  private parseValue(key: string, value: string) {
    switch (key) {
      case 'initial_date':
      case 'end_date':
        return new Date(value);
      case 'deleted':
        return String(value).toLowerCase() === 'true';
      case 'reservation_id':
      case 'resource_id':
      case 'lesson_id':
        return value; // Keep as string for UUIDs
      case 'details':
        return value; // Keep as string for text fields
      default:
        return value;
    }
  }
}
