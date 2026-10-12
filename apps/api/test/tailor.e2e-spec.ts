import { ApplicationSchema, CvChangeSchema, ProfileExperienceSchema, SavedJobCvSchema, TailorResultSchema } from '@matchbox/shared';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { AuthTokenVerificationError } from '../src/auth/auth.errors';
import type { AuthIdentity } from '../src/auth/types/auth.types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { TailorUnavailableError } from '../src/integrations/ai/ai.errors';
import { AiClient } from '../src/integrations/ai/ai-client.port';
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

describe('CV tailoring (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    const aiClient = { tailor: jest.fn() };

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
            .overrideProvider(AiClient)
            .useValue(aiClient)
            .compile();
        app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.get(AppConfig).configure(app);
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
        prisma = app.get(PrismaService);
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        aiClient.tailor.mockRejectedValue(new TailorUnavailableError());
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
    }

    async function createApplication(token: string) {
        await signIn(token);
        const experienceResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/profile/experience',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                title: 'Software Engineer',
                organization: 'Acme',
                bullets: [{ text: 'Built reliable services.' }],
            },
        });
        expect(experienceResponse.statusCode).toBe(201);
        const experience = ProfileExperienceSchema.parse(experienceResponse.json());
        const jobResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/jobs',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                companyName: 'Acme',
                title: 'Engineer',
                url: '',
                location: '',
                workMode: '',
                description: 'Build APIs',
            },
        });
        expect(jobResponse.statusCode).toBe(201);
        return { application: ApplicationSchema.parse(jobResponse.json()), experience };
    }

    it('should propose a change, accept it, and save a version', async () => {
        const { application, experience } = await createApplication('user-one-token');
        aiClient.tailor.mockResolvedValue({
            model: 'test',
            promptVersion: 'tailor-1',
            runId: null,
            changes: [
                {
                    path: 'experience[0].bullets[0]',
                    op: 'replace',
                    before: 'Built reliable services.',
                    after: 'Built reliable public APIs.',
                    evidenceIds: [experience.id],
                    rationale: 'The posting asks for APIs',
                    state: 'proposed',
                    blockedReason: null,
                },
            ],
        });

        const tailored = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(tailored.statusCode).toBe(201);
        const proposals = TailorResultSchema.parse(tailored.json());
        expect(proposals.changes).toEqual([
            expect.objectContaining({
                state: 'proposed',
                after: 'Built reliable public APIs.',
                evidence_ids: [experience.id],
            }),
        ]);
        const changeId = proposals.changes[0]?.id;
        expect(changeId).toBeDefined();

        const accepted = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/cv-changes/${changeId}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { decision: 'accepted' },
        });

        expect(accepted.statusCode).toBe(200);
        expect(CvChangeSchema.parse(accepted.json()).state).toBe('accepted');

        const saved = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/cv-versions`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(saved.statusCode).toBe(201);
        const version = SavedJobCvSchema.parse(saved.json());
        expect(version.githubSynced).toBe(false);
        expect(version.version.commitSha).toBeNull();

        const page = await app.inject({
            method: 'GET',
            url: `/api/v1/jobs/${application.job.id}`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(page.statusCode).toBe(200);
        expect(page.json()).toEqual(expect.objectContaining({ cvVersions: [expect.objectContaining({ id: version.version.id })] }));
    });

    it('should block a change with no valid evidence and refuse to accept it', async () => {
        const { application } = await createApplication('user-one-token');
        aiClient.tailor.mockResolvedValue({
            model: 'test',
            promptVersion: 'tailor-1',
            runId: null,
            changes: [
                {
                    path: 'experience[0].bullets[0]',
                    op: 'replace',
                    before: 'Built reliable services.',
                    after: 'Invented a claim',
                    evidenceIds: [],
                    rationale: 'No source',
                    state: 'proposed',
                    blockedReason: null,
                },
            ],
        });

        const tailored = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        const proposals = TailorResultSchema.parse(tailored.json());
        expect(proposals.changes[0]?.state).toBe('blocked');

        const accepted = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/cv-changes/${proposals.changes[0]?.id}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { decision: 'accepted' },
        });

        expect(accepted.statusCode).toBe(400);
    });

    it('should return unavailable when the AI service is down', async () => {
        const { application } = await createApplication('user-one-token');

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(503);
        expect(response.json()).toEqual(expect.objectContaining({ code: 'AI_UNAVAILABLE' }));
    });

    it('should keep a second tailor on the same open draft', async () => {
        const { application, experience } = await createApplication('user-one-token');
        aiClient.tailor.mockResolvedValue({
            model: 'test',
            promptVersion: 'tailor-1',
            runId: null,
            changes: [
                {
                    path: 'experience[0].bullets[0]',
                    op: 'replace',
                    before: 'Built reliable services.',
                    after: 'Built reliable public APIs.',
                    evidenceIds: [experience.id],
                    rationale: 'The posting asks for APIs',
                    state: 'proposed',
                    blockedReason: null,
                },
            ],
        });

        const first = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        const second = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);
        const drafts = await prisma.cvVersion.findMany({ where: { applicationId: application.id } });
        expect(drafts).toHaveLength(1);
        expect(drafts[0]?.status).toBe('open');
    });

    it('should let only one of two simultaneous saves record a version', async () => {
        const { application, experience } = await createApplication('user-one-token');
        aiClient.tailor.mockResolvedValue({
            model: 'test',
            promptVersion: 'tailor-1',
            runId: null,
            changes: [
                {
                    path: 'experience[0].bullets[0]',
                    op: 'replace',
                    before: 'Built reliable services.',
                    after: 'Built reliable public APIs.',
                    evidenceIds: [experience.id],
                    rationale: 'The posting asks for APIs',
                    state: 'proposed',
                    blockedReason: null,
                },
            ],
        });
        const tailored = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        const changeId = TailorResultSchema.parse(tailored.json()).changes[0]?.id;
        const accepted = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/cv-changes/${changeId}`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { decision: 'accepted' },
        });
        expect(accepted.statusCode).toBe(200);

        const [first, second] = await Promise.all([
            app.inject({
                method: 'POST',
                url: `/api/v1/applications/${application.id}/cv-versions`,
                headers: { authorization: 'Bearer user-one-token' },
            }),
            app.inject({
                method: 'POST',
                url: `/api/v1/applications/${application.id}/cv-versions`,
                headers: { authorization: 'Bearer user-one-token' },
            }),
        ]);

        expect([first.statusCode, second.statusCode].sort()).toEqual([201, 409]);
        const failed = [first, second].find((response) => response.statusCode === 409);
        expect(failed?.json()).toEqual(expect.objectContaining({ message: 'This draft was already saved or closed.' }));
        const versions = await prisma.cvVersion.findMany({ where: { applicationId: application.id } });
        expect(versions).toHaveLength(1);
        expect(versions[0]?.status).toBe('saved');
    });

    it('should hide another users application', async () => {
        const { application } = await createApplication('user-one-token');
        await signIn('user-two-token');

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${application.id}/tailor`,
            headers: { authorization: 'Bearer user-two-token' },
        });

        expect(response.statusCode).toBe(404);
    });

    it('should reject a decision that is not accept or reject', async () => {
        const { application } = await createApplication('user-one-token');

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/applications/${application.id}/cv-changes/0199bcdf-20fc-744f-bc8b-6ef7c25cd199`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: { decision: 'blocked' },
        });

        expect(response.statusCode).toBe(400);
    });
});
