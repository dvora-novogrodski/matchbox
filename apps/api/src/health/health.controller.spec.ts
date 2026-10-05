import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok for the api service', () => {
    const result = new HealthController().check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
