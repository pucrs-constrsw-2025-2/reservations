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

    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }   

    const keycloakGatewayUrl = 'http://' + this.configService.get<string>('OAUTH_INTERNAL_HOST') + ':' + this.configService.get<string>('OAUTH_INTERNAL_API_PORT');
    
    if (!keycloakGatewayUrl) {
      throw new UnauthorizedException('Keycloak configuration not found');
    }

    const validationUrl = `${keycloakGatewayUrl}/validate`;

    return this.httpService
      .post(validationUrl, {}, {
        headers: {
          accept: 'application/json',
          Authorization: authHeader,
        },
      })
      .pipe(
        map((response) => {
          console.log(response)
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