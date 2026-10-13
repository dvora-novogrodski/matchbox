import { ApplicationKitSchema, CurrentUserSchema } from '@matchbox/shared';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { AuthTokenVerificationError } from '../src/auth/auth.errors';
import type { AuthIdentity } from '../src/auth/types/auth.types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PdfRenderer } from '../src/cv/pdf/pdf-renderer.port';
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

const JOB_CV = {
    header: {
        fullName: 'Ada Lovelace',
        headline: null,
        email: null,
        phone: null,
        location: null,
        links: [],
    },
    summary: 'Builds things',
    experience: [],
    projects: [],
    skills: [],
    education: [],
};

describe('Application kit (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    const pdfRenderer = { renderHtml: jest.fn() };

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

    it('should save a cover letter and answers for the users application', async () => {
        const user = await signIn('user-one-token');
        await signIn('user-two-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({ data: { source: 'manual', externalId: 'kit-job' } });
        const application = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: job.id,
                statusId: saved.id,
                companyName: 'Acme',
                title: 'Engineer',
            },
        });

        const empty = await app.inject({
            method: 'GET',
            url: `/api/v1/applications/${application.id}/kit`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(empty.statusCode).toBe(200);
        expect(ApplicationKitSchema.parse(empty.json())).toEqual({
            coverLetter: '',
            whyCompany: '',
            whyRole: '',
            aboutYou: '',
            saved: false,
        });

        const draft = {
            coverLetter: 'Hello, I am applying.',
            whyCompany: 'The product',
            whyRole: 'The work',
            aboutYou: 'I build',
        };
        const update = await app.inject({
            method: 'PUT',
            url: `/api/v1/applications/${application.id}/kit`,
            headers: { authorization: 'Bearer user-one-token' },
            payload: draft,
        });
        expect(update.statusCode).toBe(200);
        expect(ApplicationKitSchema.parse(update.json())).toEqual({ ...draft, saved: true });

        const loaded = await app.inject({
            method: 'GET',
            url: `/api/v1/applications/${application.id}/kit`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(ApplicationKitSchema.parse(loaded.json())).toEqual({ ...draft, saved: true });

        const hidden = await app.inject({
            method: 'PUT',
            url: `/api/v1/applications/${application.id}/kit`,
            headers: { authorization: 'Bearer user-two-token' },
            payload: draft,
        });
        expect(hidden.statusCode).toBe(404);
        expect(hidden.json()).toMatchObject({ code: 'KIT_NOT_FOUND' });
    });

    it('should render the saved job CV and fall back to the base CV', async () => {
        const user = await signIn('user-one-token');
        const saved = await prisma.statusDef.findFirstOrThrow({ where: { key: 'saved' } });
        const job = await prisma.job.create({ data: { source: 'manual', externalId: 'kit-pdf' } });
        const application = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: job.id,
                statusId: saved.id,
                companyName: 'Acme',
                title: 'Engineer',
            },
        });

        const base = await app.inject({
            method: 'GET',
            url: `/api/v1/applications/${application.id}/kit/pdf`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(base.statusCode).toBe(200);
        expect(base.headers['content-type']).toContain('application/pdf');
        expect(base.body.startsWith('%PDF')).toBe(true);
        expect(pdfRenderer.renderHtml).toHaveBeenCalledWith(expect.stringContaining('User One'));

        await prisma.cvVersion.create({
            data: {
                userId: user.id,
                applicationId: application.id,
                cv: JOB_CV,
                templateId: 'default',
                status: 'saved',
            },
        });

        const tailored = await app.inject({
            method: 'GET',
            url: `/api/v1/applications/${application.id}/kit/pdf`,
            headers: { authorization: 'Bearer user-one-token' },
        });
        expect(tailored.statusCode).toBe(200);
        expect(pdfRenderer.renderHtml).toHaveBeenLastCalledWith(expect.stringContaining('Ada Lovelace'));
    });
});
