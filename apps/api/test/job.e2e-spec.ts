import { ApplicationSchema, CurrentUserSchema, JobPageSchema } from '@matchbox/shared';
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

describe('Job page (e2e)', () => {
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

    it('should return the posting, timeline, and cv versions for the current user', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const applied = await prisma.statusDef.findFirstOrThrow({ where: { key: 'applied' } });
        const job = await prisma.job.create({
            data: {
                companyName: 'Acme',
                source: 'manual',
                title: 'Engineer',
                description: 'Build things',
                location: 'Tel Aviv',
            },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id },
        });
        await prisma.event.create({
            data: {
                userId: user.id,
                applicationId: application.id,
                type: 'status_changed',
                payload: { fromStatusId: saved.id, toStatusId: applied.id },
                occurredAt: new Date('2026-10-02T00:00:00.000Z'),
            },
        });
        await prisma.cvVersion.create({
            data: { userId: user.id, applicationId: application.id, cv: {}, commitSha: 'abc123' },
        });

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const body = JobPageSchema.parse(response.json());
        expect(body.description).toBe('Build things');
        expect(body.application.job.title).toBe('Engineer');
        expect(body.events).toEqual([
            expect.objectContaining({
                type: 'status_changed',
                fromStatusId: saved.id,
                toStatusId: applied.id,
            }),
        ]);
        expect(body.cvVersions).toEqual([expect.objectContaining({ commitSha: 'abc123', isBase: false })]);
    });

    it('should not return another users job page', async () => {
        const userOne = await signIn('user-one-token');
        await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}`,
            headers: { authorization: 'Bearer user-two-token' },
        });

        expect(response.statusCode).toBe(404);
    });

    it('should reject a job id that is not a uuid', async () => {
        await signIn('user-one-token');

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/jobs/not-a-uuid',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(400);
    });

    it('should save recruiter details and append a note event when notes change', async () => {
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
            url: `/api/v1/applications/${application.id}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { recruiterName: 'Ada', recruiterContact: 'ada@example.com', notes: 'Called Tuesday' },
        });

        expect(response.statusCode).toBe(200);
        const body = ApplicationSchema.parse(response.json());
        expect(body.recruiterName).toBe('Ada');
        expect(body.notes).toBe('Called Tuesday');
        const events = await prisma.event.findMany({ where: { applicationId: application.id } });
        expect(events).toEqual([
            expect.objectContaining({ type: 'note', payload: { text: 'Called Tuesday' } }),
        ]);
    });

    it('should not append a note event when notes are cleared', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, notes: 'Old' },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { recruiterName: '', recruiterContact: '', notes: '   ' },
        });

        expect(response.statusCode).toBe(200);
        expect(ApplicationSchema.parse(response.json()).notes).toBeNull();
        expect(await prisma.event.count({ where: { applicationId: application.id } })).toBe(0);
    });

    it('should not update another users application', async () => {
        const userOne = await signIn('user-one-token');
        await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({
            data: { companyName: 'Acme', source: 'manual', title: 'Engineer' },
        });
        const application = await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}`,
            headers: { authorization: 'Bearer user-two-token' },
            payload: { recruiterName: 'Ada', recruiterContact: '', notes: 'Secret' },
        });

        expect(response.statusCode).toBe(404);
        expect(await prisma.event.count({ where: { applicationId: application.id } })).toBe(0);
    });

    it('should reject an application update that is missing notes', async () => {
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
            url: `/api/v1/applications/${application.id}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { recruiterName: 'Ada' },
        });

        expect(response.statusCode).toBe(400);
    });
});
