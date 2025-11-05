import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReservationService } from './reservation.service';
import { Reservation } from '../entities/reservation.entity';
import { AuthorizedUser } from '../entities/authorized-user.entity';

function createRepositoryMock() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  } as any;
}

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepo: any;
  let authorizedUserRepo: any;

  beforeEach(async () => {
  reservationRepo = createRepositoryMock();
  authorizedUserRepo = createRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: getRepositoryToken(Reservation), useValue: reservationRepo },
        { provide: getRepositoryToken(AuthorizedUser), useValue: authorizedUserRepo },
      ],
    }).compile();

    service = module.get(ReservationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates reservation with authorized users', async () => {
      const dto = {
        initial_date: '2025-11-01',
        end_date: '2025-11-02',
        details: 'x',
        authorizedUsers: [
          { user_id: 'u1', name: 'A' },
          { user_id: 'u2', name: 'B' },
        ],
        resource_id: 'r1',
        lesson_id: 'l1',
      };
      const created = { reservation_id: 'id1', ...dto } as Reservation;
      authorizedUserRepo.create.mockImplementation((au) => au);
      reservationRepo.create.mockReturnValue(created);
      reservationRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(authorizedUserRepo.create).toHaveBeenCalledTimes(2);
      expect(reservationRepo.create).toHaveBeenCalledWith({
        ...dto,
        deleted: false,
        authorizedUsers: dto.authorizedUsers,
      });
      expect(reservationRepo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });
  });

  describe('findAll', () => {
    it('builds where with basic equals and like/compare operators', async () => {
      const query: any = {
        reservation_id: 'id1',
        initial_date: '{gteq}2025-11-01',
        end_date: '{lt}2025-12-01',
        details: '{like}%meet%',
        resource_id: '{neq}rid',
        lesson_id: '{lteq}z', // keeps as string, will be LessThanOrEqual('z')
      };

      reservationRepo.find.mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(reservationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reservation_id: 'id1',
            // Operator fields cannot be matched for exact instance (e.g., MoreThanOrEqual object),
            // but we can assert presence and type by stringifying
          }),
          relations: ['authorizedUsers'],
        }),
      );

      // Extract the where passed to repo to validate operators roughly
  const callArg = (reservationRepo.find as jest.Mock).mock.calls[0][0];
      const where = callArg.where;
      expect(where.reservation_id).toBe('id1');
  // Check TypeORM operator-like shapes by existence of '_type' key
  expect((where.initial_date as any)).toHaveProperty('_type');
  expect((where.end_date as any)).toHaveProperty('_type');
  expect((where.details as any)).toHaveProperty('_type');
  expect((where.resource_id as any)).toHaveProperty('_type');
  expect((where.lesson_id as any)).toHaveProperty('_type');

      expect(result).toEqual([]);
    });

    it('ignores empty values', async () => {
      reservationRepo.find.mockResolvedValue([{ reservation_id: 'i' }] as any);
      const result = await service.findAll({ details: '', initial_date: undefined } as any);
      const where = (reservationRepo.find as jest.Mock).mock.calls[0][0].where;
      expect(where).toEqual({ deleted: false });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns reservation', async () => {
      const entity = { reservation_id: 'i' } as Reservation;
      reservationRepo.findOne.mockResolvedValue(entity);
      const result = await service.findOne('i');
      expect(reservationRepo.findOne).toHaveBeenCalledWith({ where: { reservation_id: 'i', deleted: false } });
      expect(result).toBe(entity);
    });

    it('throws when not found', async () => {
      reservationRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and saves', async () => {
      const entity: any = { reservation_id: 'i', details: 'a' };
      reservationRepo.findOne.mockResolvedValue(entity);
      reservationRepo.save.mockResolvedValue({ ...entity, details: 'b' });
      const result = await service.update('i', { details: 'b' } as any);
      expect(entity.details).toBe('b');
      expect(reservationRepo.save).toHaveBeenCalled();
      expect(result.details).toBe('b');
    });

    it('throws when not found', async () => {
      reservationRepo.findOne.mockResolvedValue(null);
      await expect(service.update('x', { details: 'b' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('patch', () => {
    it('patches and saves', async () => {
      const entity: any = { reservation_id: 'i', details: 'a' };
      reservationRepo.findOne.mockResolvedValue(entity);
      reservationRepo.save.mockResolvedValue({ ...entity, details: 'c' });
      const result = await service.patch('i', { details: 'c' } as any);
      expect(entity.details).toBe('c');
      expect(reservationRepo.save).toHaveBeenCalled();
      expect(result.details).toBe('c');
    });

    it('throws when not found', async () => {
      reservationRepo.findOne.mockResolvedValue(null);
      await expect(service.patch('x', { details: 'd' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes and returns message (soft delete)', async () => {
      const entity: any = { reservation_id: 'i', deleted: false };
      reservationRepo.findOne.mockResolvedValue(entity);
      reservationRepo.save.mockResolvedValue({ ...entity, deleted: true });
      const result = await service.remove('i');
      expect(entity.deleted).toBe(true);
      expect(reservationRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual({ message: 'Reserva removida' });
    });

    it('throws when not found', async () => {
      reservationRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
