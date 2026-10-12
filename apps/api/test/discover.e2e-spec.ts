import { ApplicationSchema, CurrentUserSchema, DiscoverListSchema } from '@matchbox/shared';
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

describe('Discover (e2e)', () => {
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
        await prisma.user.deleteMany();
        await prisma.job.deleteMany();
        await prisma.company.deleteMany();
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

    async function createMatch(input: {
        userId: string;
        companyName: string;
        title: string | null;
        score: number;
        decision?: 'pending' | 'saved' | 'skipped';
        externalId: string;
    }) {
        const company = await prisma.company.create({
            data: { name: input.companyName },
        });
        const job = await prisma.job.create({
            data: {
                source: 'comeet',
                externalId: input.externalId,
                companyId: company.id,
                title: input.title,
                location: 'Tel Aviv',
                workMode: 'hybrid',
                url: `https://example.com/jobs/${input.externalId}`,
                description: 'Build things',
            },
        });
        await prisma.jobMatch.create({
            data: {
                userId: input.userId,
                jobId: job.id,
                score: input.score,
                coverage: [],
                inputHash: input.externalId,
                model: 'test',
                promptVersion: 'v1',
                decision: input.decision ?? 'pending',
            },
        });
        return job;
    }

    it('should list the current users pending matches, highest score first', async () => {
        const user = await signIn('user-one-token');
        const other = await signIn('user-two-token');
        const lower = await createMatch({
            userId: user.id,
            companyName: 'Lower Co',
            title: 'Analyst',
            score: 40,
            externalId: 'lower',
        });
        const higher = await createMatch({
            userId: user.id,
            companyName: 'Higher Co',
            title: 'Engineer',
            score: 90,
            externalId: 'higher',
        });
        await createMatch({
            userId: user.id,
            companyName: 'Skipped Co',
            title: 'Skipped role',
            score: 99,
            decision: 'skipped',
            externalId: 'skipped',
        });
        await createMatch({
            userId: user.id,
            companyName: 'Untitled Co',
            title: null,
            score: 95,
            externalId: 'untitled',
        });
        await createMatch({
            userId: other.id,
            companyName: 'Other Co',
            title: 'Other role',
            score: 100,
            externalId: 'other',
        });

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/discover',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const body = DiscoverListSchema.parse(response.json());
        expect(body.items.map((item) => item.jobId)).toEqual([higher.id, lower.id]);
        expect(body.items[0]).toMatchObject({
            title: 'Engineer',
            companyName: 'Higher Co',
            location: 'Tel Aviv',
            workMode: 'hybrid',
            score: 90,
            description: 'Build things',
        });
    });

    it('should save a discovered job into the pipeline', async () => {
        const user = await signIn('user-one-token');
        const job = await createMatch({
            userId: user.id,
            companyName: 'Acme',
            title: 'Engineer',
            score: 82,
            externalId: 'acme',
        });

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/save`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const application = ApplicationSchema.parse(response.json());
        expect(application.job).toMatchObject({
            id: job.id,
            title: 'Engineer',
            companyName: 'Acme',
            location: 'Tel Aviv',
            workMode: 'hybrid',
        });
        expect(application.status.key).toBe('saved');

        const match = await prisma.jobMatch.findUniqueOrThrow({
            where: { userId_jobId: { userId: user.id, jobId: job.id } },
        });
        expect(match.decision).toBe('saved');
        expect(match.decidedAt).not.toBeNull();
        const stored = await prisma.application.findUniqueOrThrow({
            where: { id: application.id },
        });
        expect(stored.description).toBe('Build things');
        const event = await prisma.event.findFirstOrThrow({
            where: { applicationId: application.id },
        });
        expect(event.type).toBe('created');

        const again = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/save`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(again.statusCode).toBe(200);
        expect(ApplicationSchema.parse(again.json()).id).toBe(application.id);
        expect(await prisma.event.count({ where: { applicationId: application.id } })).toBe(1);

        const queue = await app.inject({
            method: 'GET',
            url: '/api/v1/discover',
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(DiscoverListSchema.parse(queue.json()).items).toEqual([]);
    });

    it('should not save another users match', async () => {
        const owner = await signIn('user-one-token');
        await signIn('user-two-token');
        const job = await createMatch({
            userId: owner.id,
            companyName: 'Acme',
            title: 'Engineer',
            score: 82,
            externalId: 'private',
        });

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/save`,
            headers: { authorization: 'Bearer user-two-token' },
        });

        expect(response.statusCode).toBe(404);
        expect(await prisma.application.count()).toBe(0);
    });

    it('should reject a job id that is not a uuid', async () => {
        await signIn('user-one-token');

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs/not-a-uuid/save',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(400);
    });

    it('should skip a discovered job and keep it out of the queue', async () => {
        const user = await signIn('user-one-token');
        const job = await createMatch({
            userId: user.id,
            companyName: 'Acme',
            title: 'Engineer',
            score: 50,
            externalId: 'skip-me',
        });

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/skip`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(204);
        const match = await prisma.jobMatch.findUniqueOrThrow({
            where: { userId_jobId: { userId: user.id, jobId: job.id } },
        });
        expect(match.decision).toBe('skipped');
        expect(await prisma.application.count()).toBe(0);

        const again = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/skip`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(again.statusCode).toBe(204);

        const save = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/save`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(save.statusCode).toBe(409);
        expect(save.json()).toMatchObject({ code: 'DISCOVER_JOB_SKIPPED' });
    });

    it('should not skip a job that is already in the pipeline', async () => {
        const user = await signIn('user-one-token');
        const job = await createMatch({
            userId: user.id,
            companyName: 'Acme',
            title: 'Engineer',
            score: 50,
            externalId: 'already-saved',
        });
        const saved = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/save`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(saved.statusCode).toBe(200);

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/jobs/${job.id}/skip`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({
            code: 'DISCOVER_JOB_ALREADY_SAVED',
        });
        const match = await prisma.jobMatch.findUniqueOrThrow({
            where: { userId_jobId: { userId: user.id, jobId: job.id } },
        });
        expect(match.decision).toBe('saved');
    });
});
