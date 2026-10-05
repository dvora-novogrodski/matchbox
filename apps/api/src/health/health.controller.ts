import { Controller, Get } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  service: 'api';
  uptimeSeconds: number;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'api',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
