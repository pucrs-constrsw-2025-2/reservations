import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from '../src/reservation.controller';
import { ReservationService } from '../src/reservation.service';
import { AuthGuard } from '../src/guards/auth.guard';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateReservationDto } from '../src/dtos/create-reservation.dto';
import { UpdateReservationDto } from '../src/dtos/update-reservation.dto';
import { PatchReservationDto } from '../src/dtos/patch-reservation.dto';
import { ExecutionContext } from '@nestjs/common';

describe('ReservationController', () => {
  let controller: ReservationController;
  let service: ReservationService;
  let authGuard: AuthGuard;

  const mockReservationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    patch: jest.fn(),
    remove: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
        {
          provide: AuthGuard,
          useValue: mockAuthGuard,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ReservationController>(ReservationController);
    service = module.get<ReservationService>(ReservationService);
    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new reservation', async () => {
      const createReservationDto: CreateReservationDto = {
        initial_date: '2025-01-01',
        end_date: '2025-01-02',
        details: 'Test reservation details',
      };

      const expectedResult = {
        id: '1',
        ...createReservationDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReservationService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createReservationDto);

      expect(service.create).toHaveBeenCalledWith(createReservationDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors during creation', async () => {
      const createReservationDto: CreateReservationDto = {
        initial_date: '2025-01-01',
        end_date: '2025-01-02',
        details: 'Test reservation details',
      };

      mockReservationService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createReservationDto)).rejects.toThrow('Database error');
      expect(service.create).toHaveBeenCalledWith(createReservationDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of reservations', async () => {
      const expectedResult = [
        {
          id: '1',
          initial_date: '2025-01-01',
          end_date: '2025-01-02',
          details: 'Reservation 1 details',
        },
        {
          id: '2',
          initial_date: '2025-01-03',
          end_date: '2025-01-04',
          details: 'Reservation 2 details',
        },
      ];

      mockReservationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedResult);
    });

    it('should handle query parameters', async () => {
      const query = { details: 'Test details', status: 'active' };
      const expectedResult = [
        {
          id: '1',
          initial_date: '2025-01-01',
          end_date: '2025-01-02',
          details: 'Filtered reservation details',
        },
      ];

      mockReservationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single reservation', async () => {
      const reservationId = '1';
      const expectedResult = {
        id: reservationId,
        initial_date: '2025-01-01',
        end_date: '2025-01-02',
        details: 'Test reservation details',
      };

      mockReservationService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(reservationId);

      expect(service.findOne).toHaveBeenCalledWith(reservationId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle non-existent reservation', async () => {
      const reservationId = 'non-existent';

      mockReservationService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(reservationId);

      expect(service.findOne).toHaveBeenCalledWith(reservationId);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a reservation completely', async () => {
      const reservationId = '1';
      const updateReservationDto: UpdateReservationDto = {
        initial_date: '2025-02-01',
        end_date: '2025-02-02',
        details: 'Updated reservation details',
      };

      const expectedResult = {
        id: reservationId,
        ...updateReservationDto,
        updatedAt: new Date(),
      };

      mockReservationService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(reservationId, updateReservationDto);

      expect(service.update).toHaveBeenCalledWith(reservationId, updateReservationDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle update errors', async () => {
      const reservationId = '1';
      const updateReservationDto: UpdateReservationDto = {
        initial_date: '2025-02-01',
        end_date: '2025-02-02',
        details: 'Updated reservation details',
      };

      mockReservationService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update(reservationId, updateReservationDto)).rejects.toThrow('Update failed');
      expect(service.update).toHaveBeenCalledWith(reservationId, updateReservationDto);
    });
  });

  describe('patch', () => {
    it('should partially update a reservation', async () => {
      const reservationId = '1';
      const patchReservationDto: PatchReservationDto = {
        details: 'Partially updated details',
      };

      const expectedResult = {
        id: reservationId,
        initial_date: '2025-01-01',
        end_date: '2025-01-02',
        details: 'Partially updated details',
        updatedAt: new Date(),
      };

      mockReservationService.patch.mockResolvedValue(expectedResult);

      const result = await controller.patch(reservationId, patchReservationDto);

      expect(service.patch).toHaveBeenCalledWith(reservationId, patchReservationDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle patch with multiple fields', async () => {
      const reservationId = '1';
      const patchReservationDto: PatchReservationDto = {
        initial_date: '2025-02-01',
        details: 'New details',
      };

      const expectedResult = {
        id: reservationId,
        initial_date: '2025-02-01',
        end_date: '2025-01-02',
        details: 'New details',
        updatedAt: new Date(),
      };

      mockReservationService.patch.mockResolvedValue(expectedResult);

      const result = await controller.patch(reservationId, patchReservationDto);

      expect(service.patch).toHaveBeenCalledWith(reservationId, patchReservationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a reservation', async () => {
      const reservationId = '1';
      const expectedResult = {
        id: reservationId,
        deleted: true,
        message: 'Reservation deleted successfully',
      };

      mockReservationService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(reservationId);

      expect(service.remove).toHaveBeenCalledWith(reservationId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle removal of non-existent reservation', async () => {
      const reservationId = 'non-existent';

      mockReservationService.remove.mockRejectedValue(new Error('Reservation not found'));

      await expect(controller.remove(reservationId)).rejects.toThrow('Reservation not found');
      expect(service.remove).toHaveBeenCalledWith(reservationId);
    });
  });

  describe('Authentication Guard', () => {
    it('should have AuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', ReservationController);
      expect(guards).toBeDefined();
      expect(guards).toContain(AuthGuard);
    });
  });
});