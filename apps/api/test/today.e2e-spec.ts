import { CurrentUserSchema, PLANS, TodaySchema } from '@matchbox/shared';
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

describe('Today (e2e)', () => {
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

    it('should list matches, saved jobs without a cv, and stale applications', async () => {
        const user = await signIn('user-one-token');
        const other = await signIn('user-two-token');
        const now = new Date();
        const idleSince = new Date(now.getTime() - (PLANS.owner['followUp.afterDays'] + 1) * 24 * 60 * 60 * 1000);
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const applied = await prisma.statusDef.findFirstOrThrow({ where: { key: 'applied' } });
        const rejected = await prisma.statusDef.findFirstOrThrow({ where: { key: 'rejected' } });
        const company = await prisma.company.create({ data: { name: 'Higher Co' } });
        const matchedJob = await prisma.job.create({
            data: {
                source: 'comeet',
                externalId: 'match',
                companyId: company.id,
                title: 'Matched role',
            },
        });
        await prisma.jobMatch.create({
            data: {
                userId: user.id,
                jobId: matchedJob.id,
                score: 88,
                coverage: [],
                inputHash: 'match',
                model: 'test',
                promptVersion: 'v1',
            },
        });
        const needsCvJob = await prisma.job.create({ data: { source: 'manual', externalId: 'needs-cv' } });
        const needsCv = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: needsCvJob.id,
                statusId: saved.id,
                companyName: 'Needs Co',
                title: 'Needs a CV',
                lastActivityAt: new Date('2026-10-10T09:00:00.000Z'),
            },
        });
        const tailoredJob = await prisma.job.create({ data: { source: 'manual', externalId: 'tailored' } });
        const tailored = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: tailoredJob.id,
                statusId: saved.id,
                companyName: 'Done Co',
                title: 'Already tailored',
            },
        });
        await prisma.cvVersion.create({
            data: { userId: user.id, applicationId: tailored.id, cv: {} },
        });
        const staleJob = await prisma.job.create({ data: { source: 'manual', externalId: 'stale' } });
        const stale = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: staleJob.id,
                statusId: applied.id,
                companyName: 'Stale Co',
                title: 'Waiting',
                lastActivityAt: idleSince,
            },
        });
        const freshJob = await prisma.job.create({ data: { source: 'manual', externalId: 'fresh' } });
        await prisma.application.create({
            data: {
                userId: user.id,
                jobId: freshJob.id,
                statusId: applied.id,
                companyName: 'Fresh Co',
                title: 'Just applied',
                lastActivityAt: now,
            },
        });
        const closedJob = await prisma.job.create({ data: { source: 'manual', externalId: 'closed' } });
        await prisma.application.create({
            data: {
                userId: user.id,
                jobId: closedJob.id,
                statusId: rejected.id,
                companyName: 'Closed Co',
                title: 'Already closed',
                lastActivityAt: idleSince,
            },
        });
        const otherJob = await prisma.job.create({ data: { source: 'manual', externalId: 'other' } });
        await prisma.application.create({
            data: {
                userId: other.id,
                jobId: otherJob.id,
                statusId: saved.id,
                companyName: 'Other Co',
                title: 'Other role',
            },
        });

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/today',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const body = TodaySchema.parse(response.json());
        expect(body.matches).toEqual([
            { jobId: matchedJob.id, title: 'Matched role', companyName: 'Higher Co', score: 88 },
        ]);
        expect(body.toTailor.map((item) => item.applicationId)).toEqual([needsCv.id]);
        expect(body.followUps.map((item) => item.applicationId)).toEqual([stale.id]);
        expect(body.stats).toEqual({ matches: 1, toTailor: 1, followUps: 1, inProgress: 2 });
    });
});
