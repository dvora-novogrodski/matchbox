import { CurrentUserSchema, FollowUpListSchema, PLANS } from '@matchbox/shared';
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

describe('Follow-ups (e2e)', () => {
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

    it('should flag idle applications and clear them when a follow-up is recorded', async () => {
        const user = await signIn('user-one-token');
        const other = await signIn('user-two-token');
        const applied = await prisma.statusDef.findFirstOrThrow({ where: { key: 'applied' } });
        const rejected = await prisma.statusDef.findFirstOrThrow({ where: { key: 'rejected' } });
        const now = new Date();
        const idleSince = new Date(now.getTime() - (PLANS.owner['followUp.afterDays'] + 1) * 24 * 60 * 60 * 1000);
        const staleJob = await prisma.job.create({ data: { source: 'manual', externalId: 'stale-follow-up' } });
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
        const freshJob = await prisma.job.create({ data: { source: 'manual', externalId: 'fresh-follow-up' } });
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
        const closedJob = await prisma.job.create({ data: { source: 'manual', externalId: 'closed-follow-up' } });
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
        const otherJob = await prisma.job.create({ data: { source: 'manual', externalId: 'other-follow-up' } });
        const otherApplication = await prisma.application.create({
            data: {
                userId: other.id,
                jobId: otherJob.id,
                statusId: applied.id,
                companyName: 'Other Co',
                title: 'Other role',
                lastActivityAt: idleSince,
            },
        });

        const listed = await app.inject({
            method: 'GET',
            url: '/api/v1/follow-ups',
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(listed.statusCode).toBe(200);
        expect(FollowUpListSchema.parse(listed.json()).items.map((item) => item.applicationId)).toEqual([stale.id]);

        const missing = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${otherApplication.id}/follow-ups`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(missing.statusCode).toBe(404);

        const recorded = await app.inject({
            method: 'POST',
            url: `/api/v1/applications/${stale.id}/follow-ups`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(recorded.statusCode).toBe(204);
        const event = await prisma.event.findFirst({ where: { applicationId: stale.id, type: 'follow_up' } });
        expect(event).not.toBeNull();

        const after = await app.inject({
            method: 'GET',
            url: '/api/v1/follow-ups',
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(FollowUpListSchema.parse(after.json()).items).toEqual([]);
    });
});
