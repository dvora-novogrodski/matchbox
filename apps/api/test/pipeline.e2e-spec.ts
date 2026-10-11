import { ApplicationListSchema, ApplicationSchema, CurrentUserSchema, StatusListSchema } from '@matchbox/shared';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { AuthTokenVerificationError } from '../src/auth/auth.errors';
import type { AuthIdentity } from '../src/auth/types/auth.types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthVerifier } from '../src/integrations/firebase/auth-verifier.port';

const IDENTITIES: Record<string, AuthIdentity> = {
    'user-one-token': {
        firebaseUid: 'firebase-user-1',
        email: 'one@example.com',
        displayName: 'User One',
    },
    'user-two-token': {
        firebaseUid: 'firebase-user-2',
        email: 'two@example.com',
        displayName: 'User Two',
    },
};

describe('Pipeline (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const authVerifier = {
            verifyIdToken: jest.fn((token: string) => {
                const identity = IDENTITIES[token];
                return identity ? Promise.resolve(identity) : Promise.reject(new AuthTokenVerificationError());
            }),
        };
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
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
        await prisma.application.deleteMany();
        await prisma.job.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    async function signIn(token: string) {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/users/me',
            headers: { authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(200);
        return CurrentUserSchema.parse(response.json());
    }

    it('should list system statuses and only the current users custom statuses', async () => {
        const userOne = await signIn('user-one-token');
        const userTwo = await signIn('user-two-token');
        await prisma.statusDef.create({
            data: { userId: userOne.id, name: 'Home assignment', position: 8, category: 'interviewing' },
        });
        await prisma.statusDef.create({
            data: { userId: userTwo.id, name: 'Secret', position: 9, category: 'active' },
        });

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/statuses',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const body = StatusListSchema.parse(response.json());
        expect(body.items.map((status) => status.key ?? status.name)).toEqual([
            'saved',
            'applied',
            'screening',
            'technical',
            'hr',
            'offer',
            'rejected',
            'withdrawn',
            'Home assignment',
        ]);
    });

    it('should list only the current users applications', async () => {
        const userOne = await signIn('user-one-token');
        const userTwo = await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer', location: 'Tel Aviv' },
        });
        await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id },
        });
        await prisma.application.create({
            data: { userId: userTwo.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/applications',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const body = ApplicationListSchema.parse(response.json());
        expect(body.items).toHaveLength(1);
        const [application] = body.items;
        expect(application?.job.companyName).toBe('Acme');
        expect(application?.job.title).toBe('Engineer');
        expect(application?.status.key).toBe('saved');
        expect(application?.appliedAt).toBeNull();
    });

    it('should record appliedAt and a status event when the application becomes active', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const applied = await prisma.statusDef.findFirstOrThrow({ where: { key: 'applied' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: job.id,
                statusId: saved.id,
                lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
            },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/status`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { statusId: applied.id },
        });

        expect(response.statusCode).toBe(200);
        const body = ApplicationSchema.parse(response.json());
        expect(body.status.key).toBe('applied');
        expect(body.appliedAt).toEqual(expect.any(String));
        expect(body.lastActivityAt).not.toBe('2026-01-01T00:00:00.000Z');

        const events = await prisma.event.findMany({ where: { applicationId: application.id } });
        expect(events).toEqual([
            expect.objectContaining({
                type: 'status_changed',
                userId: user.id,
                payload: { fromStatusId: saved.id, toStatusId: applied.id },
            }),
        ]);
    });

    it('should keep appliedAt empty when the application moves to a closed status', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const withdrawn = await prisma.statusDef.findFirstOrThrow({ where: { key: 'withdrawn' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/status`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { statusId: withdrawn.id },
        });

        expect(response.statusCode).toBe(200);
        expect(ApplicationSchema.parse(response.json()).appliedAt).toBeNull();
    });

    it('should not append an event when the status is unchanged', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/status`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { statusId: saved.id },
        });

        expect(response.statusCode).toBe(200);
        expect(await prisma.event.count({ where: { applicationId: application.id } })).toBe(0);
    });

    it('should not change another users application', async () => {
        const userOne = await signIn('user-one-token');
        await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const applied = await prisma.statusDef.findFirstOrThrow({ where: { key: 'applied' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/status`,
            headers: { authorization: 'Bearer user-two-token' },
            payload: { statusId: applied.id },
        });

        expect(response.statusCode).toBe(404);
    });

    it('should not move an application to another users custom status', async () => {
        const userOne = await signIn('user-one-token');
        const userTwo = await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const secret = await prisma.statusDef.create({
            data: { userId: userTwo.id, name: 'Secret', position: 9, category: 'active' },
        });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/status`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { statusId: secret.id },
        });

        expect(response.statusCode).toBe(404);
    });

    it('should reject a status id that is not a uuid', async () => {
        await signIn('user-one-token');

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/v1/applications/0199bcdf-20fc-744f-bc8b-6ef7c25cd124/status',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { statusId: 'applied' },
        });

        expect(response.statusCode).toBe(400);
    });
});
