import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Health (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.get(AppConfig).configure(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health/live', () => {
    it('should return 200 without checking dependencies', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/live' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ status: 'ok' });
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when the database responds', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/ready' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ status: 'ok', info: { database: { status: 'up' } } });
    });

    it('should return 503 when the database does not respond', async () => {
      jest.spyOn(app.get(PrismaService), '$queryRawUnsafe').mockRejectedValue(new Error('connection refused'));

      const res = await app.inject({ method: 'GET', url: '/health/ready' });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({ status: 'error', error: { database: { status: 'down' } } });
    });
  });
});
