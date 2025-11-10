import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('postgresql'),
    ]).then(result => {
      // Padronizar formato de resposta para compatibilidade com Actuator
      const standardized = {
        status: result.status === 'ok' ? 'UP' : 'DOWN',
        components: {} as Record<string, any>
      };
      
      // Converter info para components
      if (result.info && typeof result.info === 'object') {
        Object.keys(result.info).forEach(key => {
          const infoValue = result.info![key];
          if (infoValue && typeof infoValue === 'object' && 'status' in infoValue) {
            standardized.components[key] = {
              status: infoValue.status === 'up' ? 'UP' : 'DOWN'
            };
          }
        });
      }
      
      // Converter error para components com status DOWN
      if (result.error && typeof result.error === 'object') {
        Object.keys(result.error).forEach(key => {
          standardized.components[key] = {
            status: 'DOWN',
            details: result.error![key]
          };
        });
      }
      
      return standardized;
    });
  }
}

