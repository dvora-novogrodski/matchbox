import { ApplicationSchema, CurrentUserSchema, JobMatchResponseSchema, JobPageSchema } from '@matchbox/shared';
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
            data: { source: 'manual' },
        });
        const application = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: job.id,
                statusId: saved.id,
                companyName: 'Acme',
                title: 'Engineer',
                description: 'Build things',
                location: 'Tel Aviv',
            },
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
            data: { source: 'manual' },
        });
        await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
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
            data: { source: 'manual' },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
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
            data: { source: 'manual' },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer', notes: 'Old' },
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
            data: { source: 'manual' },
        });
        const application = await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
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
            data: { source: 'manual' },
        });
        const application = await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
        });

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { recruiterName: 'Ada' },
        });

        expect(response.statusCode).toBe(400);
    });

    it('should add a manual job as a saved application', async () => {
        const user = await signIn('user-one-token');

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload: {
                companyName: 'Acme',
                title: 'Engineer',
                url: 'https://Example.com/jobs/1/?utm_source=li',
                location: 'Tel Aviv',
                workMode: 'hybrid',
                description: 'Build things',
            },
        });

        expect(response.statusCode).toBe(201);
        const body = ApplicationSchema.parse(response.json());
        expect(body.job.companyName).toBe('Acme');
        expect(body.job.url).toBe('https://Example.com/jobs/1/?utm_source=li');
        expect(body.status.key).toBe('saved');
        expect(body.appliedAt).toBeNull();

        const stored = await prisma.application.findFirstOrThrow({ where: { id: body.id } });
        expect(stored.description).toBe('Build things');
        expect(stored.companyName).toBe('Acme');
        expect(stored.url).toBe('https://Example.com/jobs/1/?utm_source=li');
        const job = await prisma.job.findFirstOrThrow({ where: { id: body.job.id } });
        expect(job.normalizedUrl).toBe('https://example.com/jobs/1');
        expect(job.source).toBe('manual');
        const events = await prisma.event.findMany({ where: { applicationId: body.id } });
        expect(events).toEqual([expect.objectContaining({ type: 'created', userId: user.id, payload: {} })]);
    });

    it('should keep each users text when they add the same link', async () => {
        const userOne = await signIn('user-one-token');
        const userTwo = await signIn('user-two-token');
        const first = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload: {
                companyName: 'Acme',
                title: 'Engineer',
                url: 'https://example.com/jobs/1',
                location: 'Tel Aviv',
                workMode: 'hybrid',
                description: "A's text",
            },
        });
        const second = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-two-token' },
            payload: {
                companyName: 'Beta',
                title: 'Designer',
                url: 'https://example.com/jobs/1/',
                location: 'Haifa',
                workMode: 'remote',
                description: "B's text",
            },
        });

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);
        const firstBody = ApplicationSchema.parse(first.json());
        const secondBody = ApplicationSchema.parse(second.json());
        expect(secondBody.job.id).toBe(firstBody.job.id);
        expect(firstBody.job).toMatchObject({ companyName: 'Acme', title: 'Engineer', location: 'Tel Aviv', workMode: 'hybrid' });
        expect(secondBody.job).toMatchObject({
            companyName: 'Beta',
            title: 'Designer',
            location: 'Haifa',
            workMode: 'remote',
            url: 'https://example.com/jobs/1/',
        });

        const firstPage = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${firstBody.job.id}`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        const secondPage = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${secondBody.job.id}`,
            headers: { authorization: 'Bearer user-two-token' },
        });
        expect(JobPageSchema.parse(firstPage.json()).description).toBe("A's text");
        expect(JobPageSchema.parse(secondPage.json()).description).toBe("B's text");

        const stored = await prisma.application.findMany({ where: { jobId: firstBody.job.id } });
        expect(stored).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ userId: userOne.id, description: "A's text", companyName: 'Acme' }),
                expect.objectContaining({ userId: userTwo.id, description: "B's text", title: 'Designer' }),
            ]),
        );
        expect(await prisma.job.count()).toBe(1);
    });

    it('should reject a manual job the current user already has', async () => {
        await signIn('user-one-token');
        const payload = {
            companyName: 'Acme',
            title: 'Engineer',
            url: 'https://example.com/jobs/1/',
            location: '',
            workMode: '',
            description: '',
        };
        const created = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload,
        });
        const jobId = ApplicationSchema.parse(created.json()).job.id;

        const duplicate = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload,
        });

        expect(duplicate.statusCode).toBe(409);
        expect(duplicate.json()).toMatchObject({ code: 'APPLICATION_ALREADY_EXISTS', jobId });
    });

    it('should reject a manual job without a title', async () => {
        await signIn('user-one-token');

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { companyName: 'Acme', url: '', location: '', workMode: '', description: '' },
        });

        expect(response.statusCode).toBe(400);
    });

    it('should create a separate posting when a manual job has no link', async () => {
        await signIn('user-one-token');
        const payload = {
            companyName: 'Acme',
            title: 'Engineer',
            url: '',
            location: '',
            workMode: '',
            description: '',
        };

        const first = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload,
        });
        const second = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload,
        });

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);
        expect(ApplicationSchema.parse(second.json()).job.id).not.toBe(ApplicationSchema.parse(first.json()).job.id);
        expect(await prisma.job.count()).toBe(2);
    });

    it('should reject a manual job link that is not http', async () => {
        await signIn('user-one-token');

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: 'Bearer user-one-token' },
            payload: {
                companyName: 'Acme',
                title: 'Engineer',
                url: 'ftp://example.com/jobs/1',
                location: '',
                workMode: '',
                description: '',
            },
        });

        expect(response.statusCode).toBe(400);
    });

    it('should return a stored match for the current user', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({
            data: {
                source: 'manual',
                requirements: [{ text: 'TypeScript', kind: 'must', category: 'skill', hard: false }],
            },
        });
        await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
        });
        await prisma.jobMatch.create({
            data: {
                userId: user.id,
                jobId: job.id,
                score: 75,
                coverage: [
                    {
                        requirement_index: 0,
                        coverage: 'covered',
                        evidence_ids: [],
                        reason: 'Listed on the profile',
                    },
                ],
                inputHash: 'hash',
                model: 'test',
                promptVersion: 'match-1',
            },
        });

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}/match`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        expect(JobMatchResponseSchema.parse(response.json())).toEqual({
            match: {
                score: 75,
                model: 'test',
                promptVersion: 'match-1',
                requirements: [
                    {
                        requirement_index: 0,
                        coverage: 'covered',
                        evidence_ids: [],
                        reason: 'Listed on the profile',
                    },
                ],
            },
        });

        const page = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(JobPageSchema.parse(page.json()).requirements).toEqual([
            { text: 'TypeScript', kind: 'must', category: 'skill', hard: false },
        ]);
    });

    it('should return an empty match when none is stored', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({ data: { source: 'manual' } });
        await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
        });

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}/match`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ match: null });
    });

    it('should reject a stored match that does not match the analysis contract', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({ data: { source: 'manual' } });
        await prisma.application.create({
            data: { userId: user.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
        });
        await prisma.jobMatch.create({
            data: {
                userId: user.id,
                jobId: job.id,
                score: 75,
                coverage: { unexpected: true },
                inputHash: 'hash',
                model: 'test',
                promptVersion: 'match-1',
            },
        });

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}/match`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(500);
        expect(response.json()).toMatchObject({ code: 'MATCH_DATA_INVALID' });
    });

    it('should not return another users match', async () => {
        const userOne = await signIn('user-one-token');
        await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({ data: { source: 'manual' } });
        await prisma.application.create({
            data: { userId: userOne.id, jobId: job.id, statusId: saved.id, companyName: 'Acme', title: 'Engineer' },
        });

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${job.id}/match`,
            headers: { authorization: 'Bearer user-two-token' },
        });

        expect(response.statusCode).toBe(404);
    });
});
