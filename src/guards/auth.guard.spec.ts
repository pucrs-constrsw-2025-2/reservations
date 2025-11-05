import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError, lastValueFrom } from 'rxjs';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let httpService: HttpService;
  let configService: ConfigService;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  const mockHttpService = {
    post: jest.fn(),
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
        case 'OAUTH_INTERNAL_HOST':
          return 'oauth';
        case 'OAUTH_INTERNAL_API_PORT':
          return '8000';
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
    it('should throw UnauthorizedException when no authorization header', () => {
      mockRequest.headers = {};
      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when authorization header is not Bearer', () => {
      mockRequest.headers.authorization = 'Basic token123';
      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Bearer token is empty', () => {
      mockRequest.headers.authorization = '';
      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow(UnauthorizedException);
    });

    it('should validate token with OAuth gateway and store user data', async () => {
      const token = 'valid-token-123';
      const userData = { id: 'user123', name: 'Test User' };
      mockRequest.headers.authorization = `Bearer ${token}`;
      
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'OAUTH_INTERNAL_HOST':
            return 'oauth';
          case 'OAUTH_INTERNAL_API_PORT':
            return '8000';
          default:
            return undefined;
        }
      });

      (httpService.post as jest.Mock).mockReturnValue(
        of({ status: HttpStatus.OK, data: userData })
      );

      const result = guard.canActivate(mockExecutionContext) as any;
      const isAllowed = await lastValueFrom(result);

      expect(isAllowed).toBe(true);
      expect(mockRequest.user).toEqual(userData);
      expect(httpService.post).toHaveBeenCalledWith(
        'http://oauth:8000/validate',
        {},
        expect.objectContaining({
          headers: { Authorization: `Bearer ${token}`, accept: "application/json" }
        })
      );
    });

    it('should throw UnauthorizedException when OAuth validation fails', async () => {
      mockRequest.headers.authorization = 'Bearer invalid-token';

      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'OAUTH_INTERNAL_HOST':
            return 'oauth';
          case 'OAUTH_INTERNAL_API_PORT':
            return '8000';
          default:
            return undefined;
        }
      });

      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('Token validation failed'))
      );

      const result = guard.canActivate(mockExecutionContext) as any;
      await expect(lastValueFrom(result)).rejects
        .toThrow(UnauthorizedException);
    });

    it('should return false when OAuth returns 200 but no user data', async () => {
      mockRequest.headers.authorization = 'Bearer token123';
      
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'OAUTH_INTERNAL_HOST':
            return 'oauth';
          case 'OAUTH_INTERNAL_API_PORT':
            return '8000';
          default:
            return undefined;
        }
      });

      (httpService.post as jest.Mock).mockReturnValue(
        of({ status: HttpStatus.OK, data: null })
      );

      const result = guard.canActivate(mockExecutionContext) as any;
      const isAllowed = await lastValueFrom(result);

      expect(isAllowed).toBe(false);
      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe('Guard Configuration', () => {
    it('should be properly configured with dependencies', () => {
      expect(guard).toHaveProperty('canActivate');
      expect(guard['httpService']).toBeDefined();
      expect(guard['configService']).toBeDefined();
      expect(configService.get('OAUTH_INTERNAL_HOST')).toBe('oauth');
      expect(configService.get('OAUTH_INTERNAL_API_PORT')).toBe('8000');
    });
  });
});
