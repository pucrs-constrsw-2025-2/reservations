import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AxiosResponse } from 'axios';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let httpService: HttpService;
  let configService: ConfigService;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
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

    guard = module.get<AuthGuard>(AuthGuard);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock request object
    mockRequest = {
      headers: {},
      user: undefined,
    };

    // Mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    // Default config service responses
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'KEYCLOAK_GATEWAY_URL':
          return 'http://localhost:3000';
        case 'KEYCLOAK_ME_ENDPOINT':
          return '/me';
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid Bearer token with successful Keycloak response', (done) => {
      const validToken = 'valid-jwt-token';
      const userData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockRequest.headers.authorization = `Bearer ${validToken}`;

      const mockResponse: AxiosResponse = {
        status: 200,
        data: userData,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = guard.canActivate(mockExecutionContext);

      if (result instanceof Promise) {
        result.then((canActivate) => {
          expect(canActivate).toBe(true);
          expect(mockRequest.user).toEqual(userData);
          expect(httpService.get).toHaveBeenCalledWith('http://localhost:3000/me', {
            headers: {
              Authorization: `Bearer ${validToken}`,
            },
          });
          done();
        });
      } else {
        // Handle Observable case
        (result as any).subscribe({
          next: (canActivate: boolean) => {
            expect(canActivate).toBe(true);
            expect(mockRequest.user).toEqual(userData);
            expect(httpService.get).toHaveBeenCalledWith('http://localhost:3000/me', {
              headers: {
                Authorization: `Bearer ${validToken}`,
              },
            });
            done();
          },
        });
      }
    });

    it('should throw UnauthorizedException when no authorization header is provided', () => {
      mockRequest.headers = {};

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Missing or invalid Authorization header');
    });

    it('should throw UnauthorizedException when authorization header does not start with Bearer', () => {
      mockRequest.headers.authorization = 'Basic some-basic-token';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Missing or invalid Authorization header');
    });

    it('should throw UnauthorizedException when Bearer token is empty', () => {
      mockRequest.headers.authorization = 'Bearer ';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Token not provided');
    });

    it('should throw UnauthorizedException when Bearer token is just "Bearer"', () => {
      mockRequest.headers.authorization = 'Bearer';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Missing or invalid Authorization header');
    });

    it('should throw UnauthorizedException when Keycloak gateway URL is not configured', () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'KEYCLOAK_GATEWAY_URL') return undefined;
        if (key === 'KEYCLOAK_ME_ENDPOINT') return '/me';
        return undefined;
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Keycloak configuration not found');
    });

    it('should throw UnauthorizedException when Keycloak me endpoint is not configured', () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'KEYCLOAK_GATEWAY_URL') return 'http://localhost:3000';
        if (key === 'KEYCLOAK_ME_ENDPOINT') return undefined;
        return undefined;
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Keycloak configuration not found');
    });

    it('should handle Keycloak gateway returning non-200 status', (done) => {
      const invalidToken = 'invalid-jwt-token';
      mockRequest.headers.authorization = `Bearer ${invalidToken}`;

      const mockResponse: AxiosResponse = {
        status: 401,
        data: null,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(false);
          done();
        },
      });
    });

    it('should handle Keycloak gateway returning 200 but no data', (done) => {
      const token = 'token-with-no-data';
      mockRequest.headers.authorization = `Bearer ${token}`;

      const mockResponse: AxiosResponse = {
        status: 200,
        data: null,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(false);
          done();
        },
      });
    });

    it('should handle Keycloak gateway HTTP errors (401)', (done) => {
      const invalidToken = 'expired-jwt-token';
      mockRequest.headers.authorization = `Bearer ${invalidToken}`;

      const error = {
        response: {
          status: 401,
          data: { message: 'Token expired' },
        },
        message: 'Request failed with status code 401',
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        error: (err: any) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          expect(err.message).toBe('Invalid token or authentication failed');
          done();
        },
      });
    });

    it('should handle Keycloak gateway HTTP errors (403)', (done) => {
      const forbiddenToken = 'forbidden-jwt-token';
      mockRequest.headers.authorization = `Bearer ${forbiddenToken}`;

      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
        message: 'Request failed with status code 403',
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        error: (err: any) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          expect(err.message).toBe('Invalid token or authentication failed');
          done();
        },
      });
    });

    it('should handle network errors', (done) => {
      const token = 'network-error-token';
      mockRequest.headers.authorization = `Bearer ${token}`;

      const networkError = new Error('Network Error');
      mockHttpService.get.mockReturnValue(throwError(() => networkError));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        error: (err: any) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          expect(err.message).toBe('Invalid token or authentication failed');
          done();
        },
      });
    });

    it('should handle timeout errors', (done) => {
      const token = 'timeout-token';
      mockRequest.headers.authorization = `Bearer ${token}`;

      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      mockHttpService.get.mockReturnValue(throwError(() => timeoutError));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        error: (err: any) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          expect(err.message).toBe('Invalid token or authentication failed');
          done();
        },
      });
    });

    it('should store complete user data in request object', (done) => {
      const validToken = 'complete-user-data-token';
      const completeUserData = {
        id: 'user-456',
        username: 'completeuser',
        email: 'complete@example.com',
        roles: ['user', 'admin'],
        permissions: ['read', 'write'],
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockRequest.headers.authorization = `Bearer ${validToken}`;

      const mockResponse: AxiosResponse = {
        status: 200,
        data: completeUserData,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = guard.canActivate(mockExecutionContext);

      (result as any).subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(true);
          expect(mockRequest.user).toEqual(completeUserData);
          expect(mockRequest.user.roles).toEqual(['user', 'admin']);
          expect(mockRequest.user.profile.firstName).toBe('John');
          done();
        },
      });
    });
  });
});