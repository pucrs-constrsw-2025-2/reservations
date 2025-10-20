import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Repository } from 'typeorm';
import { Reservation } from './../src/entities/reservation.entity';
import { AuthorizedUser } from './../src/entities/authorized-user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Reservations API (e2e)', () => {
  let app: INestApplication<App>;
  let reservationRepo: Repository<Reservation>;
  let authorizedUserRepo: Repository<AuthorizedUser>;
  let createdReservationId: string;

  const mockAuthToken = 'mock-jwt-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    reservationRepo = moduleFixture.get<Repository<Reservation>>(getRepositoryToken(Reservation));
    authorizedUserRepo = moduleFixture.get<Repository<AuthorizedUser>>(getRepositoryToken(AuthorizedUser));
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (reservationRepo) {
      await reservationRepo.query('DELETE FROM reservation');
    }
    await app.close();
  });

  describe('/reservation (POST)', () => {
    it('should create a new reservation without authorized users', () => {
      const createDto = {
        initial_date: '2025-11-01',
        end_date: '2025-11-02',
        details: 'Test reservation',
        resource_id: '123e4567-e89b-12d3-a456-426614174000',
        lesson_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      return request(app.getHttpServer())
        .post('/reservation')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('reservation_id');
          expect(response.body.initial_date).toBe(createDto.initial_date);
          expect(response.body.end_date).toBe(createDto.end_date);
          expect(response.body.details).toBe(createDto.details);
          expect(response.body.resource_id).toBe(createDto.resource_id);
          expect(response.body.lesson_id).toBe(createDto.lesson_id);
          createdReservationId = response.body.reservation_id;
        });
    });

    it('should create a new reservation with authorized users', () => {
      const createDto = {
        initial_date: '2025-11-10',
        end_date: '2025-11-15',
        details: 'Reservation with authorized users',
        authorizedUsers: [
          { user_id: '123e4567-e89b-12d3-a456-426614174010', name: 'John Doe' },
          { user_id: '123e4567-e89b-12d3-a456-426614174011', name: 'Jane Smith' },
        ],
        resource_id: '123e4567-e89b-12d3-a456-426614174002',
      };

      return request(app.getHttpServer())
        .post('/reservation')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('reservation_id');
          expect(response.body.authorizedUsers).toHaveLength(2);
          expect(response.body.authorizedUsers[0]).toHaveProperty('name', 'John Doe');
        });
    });

    it('should fail without authentication token', () => {
      const createDto = {
        initial_date: '2025-11-01',
        end_date: '2025-11-02',
      };

      return request(app.getHttpServer())
        .post('/reservation')
        .send(createDto)
        .expect(401);
    });

    it('should fail with invalid date format', () => {
      const createDto = {
        initial_date: 'invalid-date',
        end_date: '2025-11-02',
      };

      return request(app.getHttpServer())
        .post('/reservation')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      const createDto = {
        initial_date: '2025-11-01',
        // Missing end_date
      };

      return request(app.getHttpServer())
        .post('/reservation')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('/reservation (GET)', () => {
    it('should return all reservations', () => {
      return request(app.getHttpServer())
        .get('/reservation')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter reservations by reservation_id', () => {
      return request(app.getHttpServer())
        .get(`/reservation?reservation_id=${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBe(1);
          expect(response.body[0].reservation_id).toBe(createdReservationId);
        });
    });

    it('should filter reservations by initial_date with gteq operator', () => {
      return request(app.getHttpServer())
        .get('/reservation?initial_date={gteq}2025-11-01')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          response.body.forEach((reservation: any) => {
            expect(new Date(reservation.initial_date).getTime()).toBeGreaterThanOrEqual(
              new Date('2025-11-01').getTime()
            );
          });
        });
    });

    it('should filter reservations by end_date with lt operator', () => {
      return request(app.getHttpServer())
        .get('/reservation?end_date={lt}2025-12-01')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('should filter reservations by details with like operator', () => {
      return request(app.getHttpServer())
        .get('/reservation?details={like}%Test%')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('should filter reservations by resource_id', () => {
      return request(app.getHttpServer())
        .get('/reservation?resource_id=123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('should filter reservations with neq operator', () => {
      return request(app.getHttpServer())
        .get(`/reservation?reservation_id={neq}${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          response.body.forEach((reservation: any) => {
            expect(reservation.reservation_id).not.toBe(createdReservationId);
          });
        });
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get('/reservation')
        .expect(401);
    });
  });

  describe('/reservation/:id (GET)', () => {
    it('should return a specific reservation by id', () => {
      return request(app.getHttpServer())
        .get(`/reservation/${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.reservation_id).toBe(createdReservationId);
          expect(response.body).toHaveProperty('initial_date');
          expect(response.body).toHaveProperty('end_date');
        });
    });

    it('should return 404 for non-existent reservation', () => {
      return request(app.getHttpServer())
        .get('/reservation/123e4567-e89b-12d3-a456-999999999999')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get(`/reservation/${createdReservationId}`)
        .expect(401);
    });
  });

  describe('/reservation/:id (PUT)', () => {
    it('should fully update a reservation', () => {
      const updateDto = {
        initial_date: '2025-12-01',
        end_date: '2025-12-05',
        details: 'Updated reservation',
        resource_id: '123e4567-e89b-12d3-a456-426614174003',
      };

      return request(app.getHttpServer())
        .put(`/reservation/${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updateDto)
        .expect(200)
        .then((response) => {
          expect(response.body.reservation_id).toBe(createdReservationId);
          expect(response.body.details).toBe(updateDto.details);
          expect(response.body.resource_id).toBe(updateDto.resource_id);
        });
    });

    it('should return 404 for non-existent reservation', () => {
      const updateDto = {
        initial_date: '2025-12-01',
        end_date: '2025-12-05',
      };

      return request(app.getHttpServer())
        .put('/reservation/123e4567-e89b-12d3-a456-999999999999')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .put(`/reservation/${createdReservationId}`)
        .send({ initial_date: '2025-12-01', end_date: '2025-12-05' })
        .expect(401);
    });
  });

  describe('/reservation/:id (PATCH)', () => {
    it('should partially update a reservation', () => {
      const patchDto = {
        details: 'Partially updated details',
      };

      return request(app.getHttpServer())
        .patch(`/reservation/${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(patchDto)
        .expect(200)
        .then((response) => {
          expect(response.body.reservation_id).toBe(createdReservationId);
          expect(response.body.details).toBe(patchDto.details);
        });
    });

    it('should return 404 for non-existent reservation', () => {
      return request(app.getHttpServer())
        .patch('/reservation/123e4567-e89b-12d3-a456-999999999999')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ details: 'Test' })
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .patch(`/reservation/${createdReservationId}`)
        .send({ details: 'Test' })
        .expect(401);
    });
  });

  describe('/reservation/:id (DELETE)', () => {
    it('should delete a reservation', () => {
      return request(app.getHttpServer())
        .delete(`/reservation/${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
        });
    });

    it('should return 404 for non-existent reservation', () => {
      return request(app.getHttpServer())
        .delete('/reservation/123e4567-e89b-12d3-a456-999999999999')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should return 404 when deleting already deleted reservation', () => {
      return request(app.getHttpServer())
        .delete(`/reservation/${createdReservationId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .delete(`/reservation/${createdReservationId}`)
        .expect(401);
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });
});
