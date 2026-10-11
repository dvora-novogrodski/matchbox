import { CvEditorSchema, CvVersionSchema, GithubConnectionSchema, ProfileExperienceSchema } from '@matchbox/shared';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { AuthTokenVerificationError } from '../src/auth/auth.errors';
import type { AuthIdentity } from '../src/auth/types/auth.types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PdfRenderer } from '../src/cv/pdf/pdf-renderer.port';
import { AuthVerifier } from '../src/integrations/firebase/auth-verifier.port';
import { GitHubClient } from '../src/integrations/github/github-client.port';

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

describe('CV (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    const githubClient = { commitFiles: jest.fn() };
    const pdfRenderer = { renderHtml: jest.fn() };

    beforeAll(async () => {
        process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
        const authVerifier = {
            verifyIdToken: jest.fn((token: string) => {
                const identity = IDENTITIES[token];
                return identity ? Promise.resolve(identity) : Promise.reject(new AuthTokenVerificationError());
            }),
        };
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
            .overrideProvider(AuthVerifier)
            .useValue(authVerifier)
            .overrideProvider(GitHubClient)
            .useValue(githubClient)
            .overrideProvider(PdfRenderer)
            .useValue(pdfRenderer)
            .compile();
        app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.get(AppConfig).configure(app);
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
        prisma = app.get(PrismaService);
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        pdfRenderer.renderHtml.mockResolvedValue(Buffer.from('%PDF-1.4'));
        githubClient.commitFiles.mockResolvedValue('a'.repeat(40));
        await prisma.cvChange.deleteMany();
        await prisma.cvVersion.deleteMany();
        await prisma.skill.deleteMany();
        await prisma.careerBullet.deleteMany();
        await prisma.careerItem.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should build the base CV from the career profile', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/profile/experience',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { title: 'Software Engineer', organization: 'Acme', bullets: [{ text: 'Shipped it.' }] },
        });
        const experience = ProfileExperienceSchema.parse(createResponse.json());

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/cv',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        const editor = CvEditorSchema.parse(response.json());
        expect(editor.selection.header.fullName).toBe('User One');
        expect(editor.document.experience).toEqual([
            expect.objectContaining({ careerItemId: experience.id, title: 'Software Engineer', bullets: ['Shipped it.'] }),
        ]);
        expect(editor.html).toContain('Software Engineer');
        expect(editor.github.connected).toBe(false);
    });

    it('should save a curated selection and hide excluded items from the preview', async () => {
        const first = ProfileExperienceSchema.parse(
            (
                await app.inject({
                    method: 'POST',
                    url: '/api/v1/profile/experience',
                    headers: { authorization: 'Bearer user-one-token' },
                    payload: { title: 'First', bullets: [] },
                })
            ).json(),
        );
        const second = ProfileExperienceSchema.parse(
            (
                await app.inject({
                    method: 'POST',
                    url: '/api/v1/profile/experience',
                    headers: { authorization: 'Bearer user-one-token' },
                    payload: { title: 'Second', bullets: [] },
                })
            ).json(),
        );
        const current = CvEditorSchema.parse(
            (
                await app.inject({
                    method: 'GET',
                    url: '/api/v1/cv',
                    headers: { authorization: 'Bearer user-one-token' },
                })
            ).json(),
        );

        const saveResponse = await app.inject({
            method: 'PUT',
            url: '/api/v1/cv',
            headers: { authorization: 'Bearer user-one-token' },
            payload: {
                ...current.selection,
                summary: 'Backend engineer.',
                experienceItemIds: [first.id],
            },
        });

        expect(saveResponse.statusCode).toBe(200);
        const saved = CvEditorSchema.parse(saveResponse.json());
        expect(saved.document.experience.map((entry) => entry.careerItemId)).toEqual([first.id]);
        expect(saved.document.summary).toBe('Backend engineer.');
        expect(saved.html).not.toContain('Second');
        expect(saved.catalog.experience.map((item) => item.id)).toEqual(expect.arrayContaining([first.id, second.id]));
    });

    it('should reject a selection that uses another users career item', async () => {
        const created = ProfileExperienceSchema.parse(
            (
                await app.inject({
                    method: 'POST',
                    url: '/api/v1/profile/experience',
                    headers: { authorization: 'Bearer user-one-token' },
                    payload: { title: 'Mine', bullets: [] },
                })
            ).json(),
        );
        const other = CvEditorSchema.parse(
            (
                await app.inject({
                    method: 'GET',
                    url: '/api/v1/cv',
                    headers: { authorization: 'Bearer user-two-token' },
                })
            ).json(),
        );

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/cv',
            headers: { authorization: 'Bearer user-two-token' },
            payload: { ...other.selection, experienceItemIds: [created.id] },
        });

        expect(response.statusCode).toBe(404);
    });

    it('should reject an empty name', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/cv',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { header: { fullName: '' } },
        });

        expect(response.statusCode).toBe(400);
    });

    it('should return a pdf of the base CV', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/cv/pdf',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('application/pdf');
        expect(response.body.startsWith('%PDF')).toBe(true);
        expect(pdfRenderer.renderHtml).toHaveBeenCalledWith(expect.stringContaining('User One'));
    });

    it('should store a version without a commit sha when GitHub is not connected', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/cv/versions',
            headers: { authorization: 'Bearer user-one-token' },
        });

        expect(response.statusCode).toBe(201);
        expect(CvVersionSchema.parse(response.json()).commitSha).toBeNull();
        expect(githubClient.commitFiles).not.toHaveBeenCalled();
    });

    it('should commit a version when GitHub is connected', async () => {
        const connect = await app.inject({
            method: 'PUT',
            url: '/api/v1/cv/github',
            headers: { authorization: 'Bearer user-one-token' },
            payload: { repo: 'ada/cv', token: 'ghp_secret' },
        });
        expect(GithubConnectionSchema.parse(connect.json())).toEqual({ repo: 'ada/cv', connected: true });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/cv/versions',
            headers: { authorization: 'Bearer user-one-token' },
        });

        const version = CvVersionSchema.parse(response.json());
        expect(version.commitSha).toBe('a'.repeat(40));
        expect(githubClient.commitFiles).toHaveBeenCalledWith(
            expect.objectContaining({
                repo: 'ada/cv',
                token: 'ghp_secret',
                files: [
                    expect.objectContaining({ path: 'cvs/base.json' }),
                    expect.objectContaining({ path: 'cvs/base.html' }),
                ],
            }),
        );

        const editor = CvEditorSchema.parse(
            (
                await app.inject({
                    method: 'GET',
                    url: '/api/v1/cv',
                    headers: { authorization: 'Bearer user-one-token' },
                })
            ).json(),
        );
        expect(editor.github).toEqual({ repo: 'ada/cv', connected: true });
        expect(editor.latestVersion?.commitSha).toBe(version.commitSha);
    });
});
