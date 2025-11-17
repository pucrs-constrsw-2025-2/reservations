import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { Reservation } from '../src/entities/reservation.entity';
import { AuthorizedUser } from '../src/entities/authorized-user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthGuard } from '../src/guards/auth.guard';

describe('Authorized Users API (e2e)', () => {
  let app: INestApplication<App>;
  let reservationRepo: Repository<Reservation>;
  let authorizedUserRepo: Repository<AuthorizedUser>;
  let testReservationId: string;
  let createdAuthorizedUserId: string;

  const mockAuthToken = 'mock-jwt-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }) .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (ctx) => {
        const req = ctx.switchToHttp().getRequest();
        const auth = req.headers['authorization'];
    
        if (!auth) {
          throw new UnauthorizedException();
        }
    
        return true;
      },
        }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
    reservationRepo = moduleFixture.get<Repository<Reservation>>(getRepositoryToken(Reservation));
    authorizedUserRepo = moduleFixture.get<Repository<AuthorizedUser>>(getRepositoryToken(AuthorizedUser));
    


    await app.init();


    // Create a test reservation to use for all tests
    const testReservation = reservationRepo.create({
      initial_date: new Date('2025-11-01'),
      end_date: new Date('2025-11-02'),
      details: 'Test reservation for authorized users',
      resource_id: '123e4567-e89b-12d3-a456-426614174000',
      deleted: false,
    });
    const savedReservation = await reservationRepo.save(testReservation);
    testReservationId = savedReservation.reservation_id;
  });

  afterAll(async () => {
    // Clean up test data
    if (authorizedUserRepo) {
      await authorizedUserRepo.query('DELETE FROM authorized_user');
    }
    if (reservationRepo) {
      await reservationRepo.query('DELETE FROM reservation');
    }
    await app.close();
  });

  describe('/reservations/:reservationId/authorized-users (POST)', () => {
    it('should add an authorized user to a reservation', () => {
      const createDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174010',
        name: 'John Doe',
      };

      return request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('authorized_user_id');
          expect(response.body.user_id).toBe(createDto.user_id);
          expect(response.body.name).toBe(createDto.name);
          expect(response.body.deleted).toBe(false);
          createdAuthorizedUserId = response.body.authorized_user_id;
        });
    });

    it('should add another authorized user to the same reservation', () => {
      const createDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174011',
        name: 'Jane Smith',
      };

      return request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('authorized_user_id');
          expect(response.body.user_id).toBe(createDto.user_id);
          expect(response.body.name).toBe(createDto.name);
        });
    });

    it('should return 404 for non-existent reservation', () => {
      const createDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174012',
        name: 'Bob Johnson',
      };

      return request(app.getHttpServer())
        .post('/reservations/123e4567-e89b-12d3-a456-999999999999/authorized-users')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      const createDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174013',
        name: 'Alice Brown',
      };

      return request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .send(createDto)
        .expect(401);
    });

    it('should fail with missing required fields', () => {
      const createDto = {
        // Missing user_id and name
      };

      return request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(400);
    });

    it('should fail with invalid user_id format', () => {
      const createDto = {
        user_id: 'invalid-id',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('/reservations/:reservationId/authorized-users (GET)', () => {
    it('should return all authorized users for a reservation', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
          expect(response.body.every((user: any) => user.deleted === false)).toBe(true);
        });
    });

    it('should return 404 for non-existent reservation', () => {
      return request(app.getHttpServer())
        .get('/reservations/123e4567-e89b-12d3-a456-999999999999/authorized-users')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users`)
        .expect(401);
    });
  });

  describe('/reservations/:reservationId/authorized-users/:id (GET)', () => {
    it('should return a specific authorized user by id', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.authorized_user_id).toBe(createdAuthorizedUserId);
          expect(response.body).toHaveProperty('user_id');
          expect(response.body).toHaveProperty('name');
          expect(response.body).toHaveProperty('reservation');
        });
    });

    it('should return 404 for non-existent authorized user', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users/123e4567-e89b-12d3-a456-999999999999`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent reservation', () => {
      return request(app.getHttpServer())
        .get(`/reservations/123e4567-e89b-12d3-a456-999999999999/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .expect(401);
    });
  });

  describe('/reservations/:reservationId/authorized-users/:id (PUT)', () => {
    it('should fully update an authorized user', () => {
      const updateDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174020',
        name: 'John Doe Updated',
      };

      return request(app.getHttpServer())
        .put(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updateDto)
        .expect(200)
        .then((response) => {
          expect(response.body.authorized_user_id).toBe(createdAuthorizedUserId);
          expect(response.body.user_id).toBe(updateDto.user_id);
          expect(response.body.name).toBe(updateDto.name);
        });
    });

    it('should return 404 for non-existent authorized user', () => {
      const updateDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174021',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .put(`/reservations/${testReservationId}/authorized-users/123e4567-e89b-12d3-a456-999999999999`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should return 404 for non-existent reservation', () => {
      const updateDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174022',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .put(`/reservations/123e4567-e89b-12d3-a456-999999999999/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      const updateDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174023',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .put(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .send(updateDto)
        .expect(401);
    });

    it('should fail with missing required fields', () => {
      const updateDto = {
        // Missing required fields
      };

      return request(app.getHttpServer())
        .put(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('/reservations/:reservationId/authorized-users/:id (PATCH)', () => {
    it('should partially update an authorized user name', () => {
      const patchDto = {
        name: 'John Doe Partially Updated',
      };

      return request(app.getHttpServer())
        .patch(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(patchDto)
        .expect(200)
        .then((response) => {
          expect(response.body.authorized_user_id).toBe(createdAuthorizedUserId);
          expect(response.body.name).toBe(patchDto.name);
        });
    });

    it('should partially update an authorized user user_id', () => {
      const patchDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174030',
      };

      return request(app.getHttpServer())
        .patch(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(patchDto)
        .expect(200)
        .then((response) => {
          expect(response.body.authorized_user_id).toBe(createdAuthorizedUserId);
          expect(response.body.user_id).toBe(patchDto.user_id);
        });
    });

    it('should return 404 for non-existent authorized user', () => {
      const patchDto = {
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .patch(`/reservations/${testReservationId}/authorized-users/123e4567-e89b-12d3-a456-999999999999`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(patchDto)
        .expect(404);
    });

    it('should return 404 for non-existent reservation', () => {
      const patchDto = {
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .patch(`/reservations/123e4567-e89b-12d3-a456-999999999999/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(patchDto)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      const patchDto = {
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .patch(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .send(patchDto)
        .expect(401);
    });
  });

  describe('/reservations/:reservationId/authorized-users/:id (DELETE)', () => {
    let userToDeleteId: string;

    beforeAll(async () => {
      // Create a user specifically for deletion testing
      const userToDelete = authorizedUserRepo.create({
        user_id: '123e4567-e89b-12d3-a456-426614174040',
        name: 'User To Delete',
        deleted: false,
        reservation: await reservationRepo.findOne({ where: { reservation_id: testReservationId } }),
      });
      const savedUser = await authorizedUserRepo.save(userToDelete);
      userToDeleteId = savedUser.authorized_user_id;
    });

    it('should soft delete an authorized user', () => {
      return request(app.getHttpServer())
        .delete(`/reservations/${testReservationId}/authorized-users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
          expect(response.body.message).toBe('Usuário autorizado removido');
        });
    });

    it('should return 404 when deleting already deleted authorized user', () => {
      return request(app.getHttpServer())
        .delete(`/reservations/${testReservationId}/authorized-users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent authorized user', () => {
      return request(app.getHttpServer())
        .delete(`/reservations/${testReservationId}/authorized-users/123e4567-e89b-12d3-a456-999999999999`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent reservation', () => {
      return request(app.getHttpServer())
        .delete(`/reservations/123e4567-e89b-12d3-a456-999999999999/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .delete(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .expect(401);
    });
  });

  describe('Soft delete behavior', () => {
    it('should not return deleted authorized users in list', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      const deletedUsers = response.body.filter((user: any) => user.deleted === true);
      expect(deletedUsers.length).toBe(0);
    });

    it('should not find deleted authorized user by id', async () => {
      // Create and delete a user
      const createDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174050',
        name: 'Temp User',
      };

      const createResponse = await request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(201);

      const tempUserId = createResponse.body.authorized_user_id;

      await request(app.getHttpServer())
        .delete(`/reservations/${testReservationId}/authorized-users/${tempUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users/${tempUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed reservation ID', () => {
      return request(app.getHttpServer())
        .get('/reservations/123e4567-e89b-12d3-a456-426614174015/authorized-users')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should handle malformed authorized user ID', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${testReservationId}/authorized-users/123e4567-e89b-12d3-a456-426614174015`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should handle empty request body on POST', () => {
      return request(app.getHttpServer())
        .post(`/reservations/${testReservationId}/authorized-users`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({})
        .expect(400);
    });

    it('should handle empty request body on PATCH', () => {
      return request(app.getHttpServer())
        .patch(`/reservations/${testReservationId}/authorized-users/${createdAuthorizedUserId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({})
        .expect(200);
    });
  });
});