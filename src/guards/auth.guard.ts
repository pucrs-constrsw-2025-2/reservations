import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, map, catchError, of } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim() === '') {
      throw new UnauthorizedException('Token not provided');
    }

    const keycloakGatewayUrl = this.configService.get<string>('KEYCLOAK_GATEWAY_URL');
    const meEndpoint = this.configService.get<string>('KEYCLOAK_ME_ENDPOINT');
    
    if (!keycloakGatewayUrl || !meEndpoint) {
      throw new UnauthorizedException('Keycloak configuration not found');
    }

    const validationUrl = `${keycloakGatewayUrl}${meEndpoint}`;

    return this.httpService
      .get(validationUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        map((response) => {
          if (response.status === HttpStatus.OK && response.data) {
            // Store user information in request for later use
            request['user'] = response.data;
            return true;
          }
          return false;
        }),
        catchError((error) => {
          console.error('Token validation failed:', error.message);
          throw new UnauthorizedException('Invalid token or authentication failed');
        }),
      );
  }
}