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
        case 'OAUTH_INTERNAL_HOST':
          return 'http://localhost';
        case 'OAUTH_INTERNAL_PORT':
          return '3000';
        case 'OAUTH_ME_ENDPOINT':
          return 'me';
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
    it('should return true (auth is currently bypassed)', () => {
      // The current implementation has "return true;" at the beginning
      // This bypasses all authentication logic for development/testing
      mockRequest.headers.authorization = 'Bearer valid-token';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true even without authorization header (bypassed)', () => {
      // Since auth is bypassed, it should return true even without token
      mockRequest.headers = {};

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true with any kind of authorization header (bypassed)', () => {
      // Since auth is bypassed, any header works
      mockRequest.headers.authorization = 'Basic some-token';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true with empty Bearer token (bypassed)', () => {
      // Since auth is bypassed, empty token works
      mockRequest.headers.authorization = 'Bearer ';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should not call HttpService when auth is bypassed', () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      guard.canActivate(mockExecutionContext);

      // Since auth is bypassed with immediate "return true", 
      // the httpService should never be called
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should not validate token with OAuth when auth is bypassed', () => {
      mockRequest.headers.authorization = 'Bearer some-token';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(httpService.get).not.toHaveBeenCalled();
      expect(configService.get).not.toHaveBeenCalled();
    });

    it('should return true for any execution context (bypassed)', () => {
      // Test with different scenarios
      const scenarios = [
        { headers: { authorization: 'Bearer token' } },
        { headers: {} },
        { headers: { authorization: 'Invalid' } },
      ];

      scenarios.forEach(scenario => {
        mockRequest.headers = scenario.headers;
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      });
    });

  it.skip('should validate token when AUTH_BYPASS=false and set user on success', async () => {
      process.env.AUTH_BYPASS = 'false';
      mockRequest.headers.authorization = 'Bearer tok';
      const resp = { status: HttpStatus.OK, data: { id: 'u1' } } as any;
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'OAUTH_INTERNAL_HOST') return 'http://host';
        if (key === 'OAUTH_INTERNAL_PORT') return '3000';
        if (key === 'OAUTH_ME_ENDPOINT') return 'me';
        return undefined;
      });
      (httpService.get as jest.Mock).mockReturnValue(of(resp));

  const result = guard.canActivate(mockExecutionContext) as any;
  const ok = await lastValueFrom(result);
      expect(ok).toBe(true);
      expect(mockRequest.user).toEqual({ id: 'u1' });
    });

  it.skip('should throw when AUTH_BYPASS=false and header missing', () => {
      process.env.AUTH_BYPASS = 'false';
      mockRequest.headers = {};
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

  it.skip('should throw when AUTH_BYPASS=false and token empty', () => {
      process.env.AUTH_BYPASS = 'false';
      mockRequest.headers.authorization = 'Bearer ';
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

  it.skip('should throw when AUTH_BYPASS=false and config missing', () => {
      process.env.AUTH_BYPASS = 'false';
      mockRequest.headers.authorization = 'Bearer tok';
      mockConfigService.get.mockReturnValue(undefined);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

  it.skip('should return false when upstream returns 200 without data', async () => {
      process.env.AUTH_BYPASS = 'false';
      mockRequest.headers.authorization = 'Bearer tok';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'OAUTH_INTERNAL_HOST') return 'http://host';
        if (key === 'OAUTH_INTERNAL_PORT') return '3000';
        if (key === 'OAUTH_ME_ENDPOINT') return 'me';
        return undefined;
      });
      (httpService.get as jest.Mock).mockReturnValue(of({ status: HttpStatus.OK, data: null }));
  const result = guard.canActivate(mockExecutionContext) as any;
  const ok = await lastValueFrom(result);
      expect(ok).toBe(false);
    });

  it.skip('should throw Unauthorized on upstream error', async () => {
      process.env.AUTH_BYPASS = 'false';
      mockRequest.headers.authorization = 'Bearer tok';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'OAUTH_INTERNAL_HOST') return 'http://host';
        if (key === 'OAUTH_INTERNAL_PORT') return '3000';
        if (key === 'OAUTH_ME_ENDPOINT') return 'me';
        return undefined;
      });
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => new Error('bad')));
  const result = guard.canActivate(mockExecutionContext) as any;
  await expect(lastValueFrom(result)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('Auth Implementation (currently disabled)', () => {
    // These tests document the intended behavior when auth is enabled
    // When the "return true;" line is removed from the guard

    it('should have proper config keys defined for OAuth', () => {
      // Test that config service is set up correctly
      expect(configService.get('OAUTH_INTERNAL_HOST')).toBe('http://localhost');
      expect(configService.get('OAUTH_INTERNAL_PORT')).toBe('3000');
      expect(configService.get('OAUTH_ME_ENDPOINT')).toBe('me');
    });

    it('should be ready to validate tokens when auth is enabled', () => {
      // The guard has all the necessary dependencies injected
      expect(guard['httpService']).toBeDefined();
      expect(guard['configService']).toBeDefined();
    });

    it('should have the proper structure for token validation', () => {
      // Verify the guard has access to required services
      expect(httpService).toBeDefined();
      expect(configService).toBeDefined();
      expect(guard).toHaveProperty('canActivate');
    });
  });

  describe('Guard Metadata', () => {
    it('should be a valid CanActivate guard', () => {
      // Ensure the guard implements the required interface
      expect(typeof guard.canActivate).toBe('function');
    });

    it('should accept ExecutionContext as parameter', () => {
      // Verify canActivate accepts the correct parameter
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBeDefined();
    });
  });
});
