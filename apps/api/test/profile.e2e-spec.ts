import { ProfileExperienceSchema, ProfileSchema, ReplaceProfileSkillsResponseSchema } from '@matchbox/shared';
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

describe('Profile (e2e)', () => {
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
        await prisma.skill.deleteMany();
        await prisma.careerBullet.deleteMany();
        await prisma.careerItem.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return an empty grouped profile for a new user', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/profile',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        expect(ProfileSchema.parse(response.json())).toEqual({
            experience: [],
            projects: [],
            education: [],
            skills: [],
        });
    });

    it('should create experience with bullets in one request', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/profile/experience',
            headers: { authorization: 'Bearer user-one-token' },
            payload: {
                title: 'Software Engineer',
                organization: 'Acme',
                bullets: [{ text: 'Built reliable services.' }],
            },
        });

        expect(createResponse.statusCode).toBe(201);
        const experience = ProfileExperienceSchema.parse(createResponse.json());
        expect(experience.bullets).toHaveLength(1);

        const listResponse = await app.inject({
            method: 'GET',
            url: '/api/v1/profile',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(ProfileSchema.parse(listResponse.json()).experience).toEqual([
            expect.objectContaining({
                title: 'Software Engineer',
                bullets: [{ id: experience.bullets[0].id, text: 'Built reliable services.' }],
            }),
        ]);
    });

    it('should keep skill ids when names are unchanged on replace', async () => {
        const first = await app.inject({
            method: 'PUT',
            url: '/api/v1/profile/skills',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { skills: ['TypeScript', 'Go'] },
        });
        const firstBody = ReplaceProfileSkillsResponseSchema.parse(first.json());

        const second = await app.inject({
            method: 'PUT',
            url: '/api/v1/profile/skills',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { skills: ['typescript', 'Go'] },
        });
        const secondBody = ReplaceProfileSkillsResponseSchema.parse(second.json());

        expect(secondBody.skills.map((skill) => skill.id)).toEqual(firstBody.skills.map((skill) => skill.id));
    });

    it('should not update another users experience item', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/profile/experience',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { title: 'Mine', bullets: [] },
        });
        const item = ProfileExperienceSchema.parse(createResponse.json());

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/profile/experience/${item.id}`,
            headers: { authorization: 'Bearer user-two-token' },
            payload: { title: 'Theirs' },
        });

        expect(response.statusCode).toBe(404);
    });

    it('should allow browser requests to update and delete profile resources', async () => {
        const response = await app.inject({
            method: 'OPTIONS',
            url: '/api/v1/profile/skills',
            headers: {
                origin: 'http://localhost:5173',
                'access-control-request-method': 'PUT',
                'access-control-request-headers': 'authorization,x-request-id',
            },
        });

        expect(response.statusCode).toBe(204);
        expect(response.headers['access-control-allow-methods']).toContain('PUT');
        expect(response.headers['access-control-allow-methods']).toContain('DELETE');
    });
});
