# Reservations API - Test Documentation

## Overview

The e2e tests have been updated to match the current reservation entity structure and controller/service logic.

## What Was Updated

### 1. **Query DTO (`query-reservation.dto.ts`)**

Updated to match the actual `Reservation` entity fields:

- ✅ Added `reservation_id` - UUID field for filtering by reservation ID
- ✅ Kept `initial_date` - Date field for start of reservation
- ✅ Changed `final_date` to `end_date` - To match entity field name
- ✅ Changed `description` to `details` - To match entity field name
- ✅ Added `resource_id` - UUID field for filtering by resource
- ✅ Added `lesson_id` - UUID field for filtering by lesson
- ❌ Removed `status` - Field doesn't exist in entity
- ❌ Removed `quantity` - Field doesn't exist in entity

### 2. **Controller (`reservation.controller.ts`)**

Updated `@ApiQuery` decorators to match the new DTO fields:

- Updated query parameter documentation
- Aligned with actual reservation entity structure

### 3. **Service (`reservation.service.ts`)**

Updated `parseValue()` method to handle correct field types:

- Handles `initial_date` and `end_date` as Date objects
- Handles UUIDs (`reservation_id`, `resource_id`, `lesson_id`) as strings
- Handles `details` as string

### 4. **E2E Tests (`test/app.e2e-spec.ts`)**

Completely rewrote the test suite with comprehensive coverage:

#### Test Suites:

1. **POST /reservation**
   - ✅ Create reservation without authorized users
   - ✅ Create reservation with authorized users
   - ✅ Fail without authentication token
   - ✅ Fail with invalid date format
   - ✅ Fail with missing required fields

2. **GET /reservation**
   - ✅ Return all reservations
   - ✅ Filter by `reservation_id`
   - ✅ Filter by `initial_date` with `{gteq}` operator
   - ✅ Filter by `end_date` with `{lt}` operator
   - ✅ Filter by `details` with `{like}` operator
   - ✅ Filter by `resource_id`
   - ✅ Filter with `{neq}` operator
   - ✅ Fail without authentication token

3. **GET /reservation/:id**
   - ✅ Return specific reservation by ID
   - ✅ Return 404 for non-existent reservation
   - ✅ Fail without authentication token

4. **PUT /reservation/:id**
   - ✅ Fully update a reservation
   - ✅ Return 404 for non-existent reservation
   - ✅ Fail without authentication token

5. **PATCH /reservation/:id**
   - ✅ Partially update a reservation
   - ✅ Return 404 for non-existent reservation
   - ✅ Fail without authentication token

6. **DELETE /reservation/:id**
   - ✅ Delete a reservation
   - ✅ Return 404 for non-existent reservation
   - ✅ Return 404 when deleting already deleted reservation
   - ✅ Fail without authentication token

7. **GET /health**
   - ✅ Return health status

## Running the Tests

### Prerequisites

1. PostgreSQL database must be running (can use docker-compose)
2. Node.js and npm installed
3. Dependencies installed: `npm install`

### Commands

```bash
# Navigate to reservations directory
cd backend/reservations

# Install dependencies (if not already done)
npm install

# Run e2e tests
npm run test:e2e

# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Running with Docker

To run tests with a proper database setup:

```bash
# Start PostgreSQL from root directory
docker-compose up postgresql -d

# Wait for database to be ready, then run tests
cd backend/reservations
npm run test:e2e
```

## Test Configuration

### Environment Variables for Testing

The tests use the following database configuration from `AppModule`:

- `DATABASE_HOST`: Default 'localhost'
- `DATABASE_PORT`: Default 5432
- `DATABASE_USER`: Default 'postgres'
- `DATABASE_PASSWORD`: Default 'postgres'
- `DATABASE_NAME`: Default 'reservations'

### Mock Authentication

The `AuthGuard` currently has `return true;` at the beginning, which bypasses actual authentication for testing purposes. This allows tests to run without needing valid JWT tokens.

## Query Operators Supported

The API supports the following query operators:

- `{eq}` or no operator - Equals (default)
- `{neq}` - Not equals
- `{gt}` - Greater than
- `{gteq}` - Greater than or equal
- `{lt}` - Less than
- `{lteq}` - Less than or equal
- `{like}` - Pattern matching (use with % wildcards)

### Examples:

```
GET /reservation?initial_date={gteq}2025-11-01
GET /reservation?details={like}%meeting%
GET /reservation?reservation_id={neq}some-uuid
GET /reservation?end_date={lt}2025-12-01
```

## Notes

1. **Database Synchronization**: The app uses `synchronize: true` in TypeORM config, which auto-creates tables. In production, use migrations instead.

2. **Test Data Cleanup**: Tests clean up data in `afterAll()` hook using `DELETE FROM reservation`.

3. **Authorized Users**: Tests verify that authorized users are properly saved with cascade when creating reservations.

4. **Import Statement**: Changed from `import * as request from 'supertest'` to `import request from 'supertest'` for compatibility.

## Future Improvements

1. **Test Database**: Create a separate test database configuration
2. **Mock External Services**: Mock the OAuth service calls
3. **Test Fixtures**: Create reusable test data fixtures
4. **Integration with CI/CD**: Add test scripts to CI/CD pipeline
5. **Performance Tests**: Add performance/load testing
6. **Contract Tests**: Add contract testing with other services
