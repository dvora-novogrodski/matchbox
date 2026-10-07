import { CurrentUserSchema } from '@matchbox/shared';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { AuthTokenVerificationError } from '../src/auth/auth.errors';
import type { AuthIdentity } from '../src/auth/types/auth.types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthVerifier } from '../src/integrations/firebase/auth-verifier.port';

const IDENTITY: AuthIdentity = {
  firebaseUid: 'firebase-user-1',
  email: 'user@example.com',
  displayName: 'Matchbox User',
};

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const authVerifier = {
      verifyIdToken: jest.fn((token: string) => {
        if (token !== 'valid-token') {
          return Promise.reject(new AuthTokenVerificationError());
        }
        return Promise.resolve(IDENTITY);
      }),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthVerifier)
      .useValue(authVerifier)
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.get(AppConfig).configure(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return 401 when the bearer token is missing', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/users/me' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 when the bearer token is invalid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: { authorization: 'Bearer invalid-token' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should provision and return the authenticated user', async () => {
      const request = {
        method: 'GET' as const,
        url: '/api/v1/users/me',
        headers: { authorization: 'Bearer valid-token' },
      };

      const first = await app.inject(request);
      const second = await app.inject(request);
      const firstBody = CurrentUserSchema.parse(first.json());
      const secondBody = CurrentUserSchema.parse(second.json());

      expect(first.statusCode).toBe(200);
      expect(firstBody.id).toEqual(expect.any(String));
      expect(firstBody.email).toBe(IDENTITY.email);
      expect(firstBody.displayName).toBe(IDENTITY.displayName);
      expect(secondBody).toEqual(firstBody);
      await expect(prisma.user.count()).resolves.toBe(1);
    });
  });
});
