import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizedUserController } from '../src/authorized-user.controller';
import { AuthorizedUserService } from '../src/authorized-user.service';
import { AuthGuard } from '../src/guards/auth.guard';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateAuthorizedUserDto, UpdateAuthorizedUserDto, PatchAuthorizedUserDto } from '../src/dtos/authorized-user.dto';

describe('AuthorizedUserController', () => {
  let controller: AuthorizedUserController;
  let service: AuthorizedUserService;
  let authGuard: AuthGuard;

  const mockAuthorizedUserService = {
    addToReservation: jest.fn(),
    findByReservation: jest.fn(),
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
      controllers: [AuthorizedUserController],
      providers: [
        {
          provide: AuthorizedUserService,
          useValue: mockAuthorizedUserService,
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

    controller = module.get<AuthorizedUserController>(AuthorizedUserController);
    service = module.get<AuthorizedUserService>(AuthorizedUserService);
    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should add a new authorized user to a reservation', async () => {
      const reservationId = 'reservation-123';
      const createAuthorizedUserDto: CreateAuthorizedUserDto = {
        user_id: 'user-456',
        name: 'John Doe',
      };

      const expectedResult = {
        id: 'auth-user-1',
        reservationId,
        ...createAuthorizedUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthorizedUserService.addToReservation.mockResolvedValue(expectedResult);

      const result = await controller.create(reservationId, createAuthorizedUserDto);

      expect(service.addToReservation).toHaveBeenCalledWith(reservationId, createAuthorizedUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors during creation', async () => {
      const reservationId = 'reservation-123';
      const createAuthorizedUserDto: CreateAuthorizedUserDto = {
        user_id: 'user-456',
        name: 'John Doe',
      };

      mockAuthorizedUserService.addToReservation.mockRejectedValue(new Error('Reservation not found'));

      await expect(controller.create(reservationId, createAuthorizedUserDto)).rejects.toThrow('Reservation not found');
      expect(service.addToReservation).toHaveBeenCalledWith(reservationId, createAuthorizedUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all authorized users for a reservation', async () => {
      const reservationId = 'reservation-123';
      const expectedResult = [
        {
          id: 'auth-user-1',
          user_id: 'user-456',
          name: 'John Doe',
          reservationId,
        },
        {
          id: 'auth-user-2',
          user_id: 'user-789',
          name: 'Jane Smith',
          reservationId,
        },
      ];

      mockAuthorizedUserService.findByReservation.mockResolvedValue(expectedResult);

      const result = await controller.findAll(reservationId);

      expect(service.findByReservation).toHaveBeenCalledWith(reservationId);
      expect(result).toEqual(expectedResult);
    });

    it('should return empty array for reservation with no authorized users', async () => {
      const reservationId = 'reservation-456';
      const expectedResult = [];

      mockAuthorizedUserService.findByReservation.mockResolvedValue(expectedResult);

      const result = await controller.findAll(reservationId);

      expect(service.findByReservation).toHaveBeenCalledWith(reservationId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors when finding all', async () => {
      const reservationId = 'reservation-123';

      mockAuthorizedUserService.findByReservation.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll(reservationId)).rejects.toThrow('Database error');
      expect(service.findByReservation).toHaveBeenCalledWith(reservationId);
    });
  });

  describe('findOne', () => {
    it('should return a specific authorized user', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const expectedResult = {
        id: userId,
        user_id: 'user-456',
        name: 'John Doe',
        reservationId,
      };

      mockAuthorizedUserService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(reservationId, userId);

      expect(service.findOne).toHaveBeenCalledWith(reservationId, userId);
      expect(result).toEqual(expectedResult);
    });

    it('should return null for non-existent authorized user', async () => {
      const reservationId = 'reservation-123';
      const userId = 'non-existent';

      mockAuthorizedUserService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(reservationId, userId);

      expect(service.findOne).toHaveBeenCalledWith(reservationId, userId);
      expect(result).toBeNull();
    });

    it('should handle service errors when finding one', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';

      mockAuthorizedUserService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(controller.findOne(reservationId, userId)).rejects.toThrow('User not found');
      expect(service.findOne).toHaveBeenCalledWith(reservationId, userId);
    });
  });

  describe('update', () => {
    it('should update an authorized user completely', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const updateAuthorizedUserDto: UpdateAuthorizedUserDto = {
        user_id: 'user-updated',
        name: 'Updated Name',
      };

      const expectedResult = {
        id: userId,
        reservationId,
        ...updateAuthorizedUserDto,
        updatedAt: new Date(),
      };

      mockAuthorizedUserService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(reservationId, userId, updateAuthorizedUserDto);

      expect(service.update).toHaveBeenCalledWith(reservationId, userId, updateAuthorizedUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle update errors', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const updateAuthorizedUserDto: UpdateAuthorizedUserDto = {
        user_id: 'user-updated',
        name: 'Updated Name',
      };

      mockAuthorizedUserService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update(reservationId, userId, updateAuthorizedUserDto)).rejects.toThrow('Update failed');
      expect(service.update).toHaveBeenCalledWith(reservationId, userId, updateAuthorizedUserDto);
    });
  });

  describe('patch', () => {
    it('should partially update an authorized user', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const patchAuthorizedUserDto: PatchAuthorizedUserDto = {
        name: 'Partially Updated Name',
      };

      const expectedResult = {
        id: userId,
        user_id: 'user-456',
        name: 'Partially Updated Name',
        reservationId,
        updatedAt: new Date(),
      };

      mockAuthorizedUserService.patch.mockResolvedValue(expectedResult);

      const result = await controller.patch(reservationId, userId, patchAuthorizedUserDto);

      expect(service.patch).toHaveBeenCalledWith(reservationId, userId, patchAuthorizedUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle patch with multiple fields', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const patchAuthorizedUserDto: PatchAuthorizedUserDto = {
        user_id: 'new-user-id',
        name: 'New Name',
      };

      const expectedResult = {
        id: userId,
        user_id: 'new-user-id',
        name: 'New Name',
        reservationId,
        updatedAt: new Date(),
      };

      mockAuthorizedUserService.patch.mockResolvedValue(expectedResult);

      const result = await controller.patch(reservationId, userId, patchAuthorizedUserDto);

      expect(service.patch).toHaveBeenCalledWith(reservationId, userId, patchAuthorizedUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle patch errors', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const patchAuthorizedUserDto: PatchAuthorizedUserDto = {
        name: 'Updated Name',
      };

      mockAuthorizedUserService.patch.mockRejectedValue(new Error('Patch failed'));

      await expect(controller.patch(reservationId, userId, patchAuthorizedUserDto)).rejects.toThrow('Patch failed');
      expect(service.patch).toHaveBeenCalledWith(reservationId, userId, patchAuthorizedUserDto);
    });
  });

  describe('remove', () => {
    it('should remove an authorized user from a reservation', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';
      const expectedResult = {
        id: userId,
        deleted: true,
        message: 'Authorized user removed successfully',
      };

      mockAuthorizedUserService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(reservationId, userId);

      expect(service.remove).toHaveBeenCalledWith(reservationId, userId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle removal of non-existent authorized user', async () => {
      const reservationId = 'reservation-123';
      const userId = 'non-existent';

      mockAuthorizedUserService.remove.mockRejectedValue(new Error('Authorized user not found'));

      await expect(controller.remove(reservationId, userId)).rejects.toThrow('Authorized user not found');
      expect(service.remove).toHaveBeenCalledWith(reservationId, userId);
    });

    it('should handle removal errors', async () => {
      const reservationId = 'reservation-123';
      const userId = 'auth-user-1';

      mockAuthorizedUserService.remove.mockRejectedValue(new Error('Database error'));

      await expect(controller.remove(reservationId, userId)).rejects.toThrow('Database error');
      expect(service.remove).toHaveBeenCalledWith(reservationId, userId);
    });
  });

  describe('Authentication Guard', () => {
    it('should have AuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', AuthorizedUserController);
      expect(guards).toBeDefined();
      expect(guards).toContain(AuthGuard);
    });
  });
});