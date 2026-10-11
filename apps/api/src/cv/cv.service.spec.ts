import { type BaseCv, DEFAULT_CV_TEMPLATE_ID, type Profile } from '@matchbox/shared';
import { BadRequestException } from '@nestjs/common';

import { decryptToken, encryptToken } from '../integrations/crypto/token-cipher';
import type { GitHubClient } from '../integrations/github/github-client.port';
import type { ProfileService } from '../profile/profile.service';
import { BASE_CV_HTML_PATH, BASE_CV_JSON_PATH } from './cv.constants';
import { CvItemNotFoundError } from './cv.errors';
import type { CvRepository } from './cv.repository';
import { CvService } from './cv.service';
import type { PdfRenderer } from './pdf/pdf-renderer.port';
import type { StoredCvVersion, UserCvRecord } from './types/cv.types';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const ITEM_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';
const MISSING_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd199';
const KEY = Buffer.alloc(32, 7);

function selection(experienceItemIds: string[]): BaseCv {
    return {
        header: {
            fullName: 'Ada Lovelace',
            headline: null,
            email: null,
            phone: null,
            location: null,
            links: [],
        },
        summary: '',
        experienceItemIds,
        projectItemIds: [],
        skillIds: [],
        educationItemIds: [],
    };
}

const profile: Profile = {
    experience: [
        {
            id: ITEM_ID,
            title: 'Engineer',
            organization: 'Acme',
            startDate: null,
            endDate: null,
            tech: [],
            bullets: [],
        },
    ],
    projects: [],
    education: [],
    skills: [],
};

describe('CvService', () => {
    const repository = {
        findUserCvRecord: jest.fn(),
        saveBaseCv: jest.fn(),
        saveGithubCredentials: jest.fn(),
        clearGithubCredentials: jest.fn(),
        createBaseVersion: jest.fn(),
        findLatestBaseVersion: jest.fn(),
    } as jest.Mocked<CvRepository>;
    const profileService = { getProfile: jest.fn() } as unknown as jest.Mocked<Pick<ProfileService, 'getProfile'>>;
    const githubClient = { commitFiles: jest.fn() } as jest.Mocked<GitHubClient>;
    const pdfRenderer = { renderHtml: jest.fn() } as jest.Mocked<PdfRenderer>;
    const service = new CvService(
        repository,
        profileService as unknown as ProfileService,
        githubClient,
        pdfRenderer,
        KEY,
    );

    const record: UserCvRecord = {
        displayName: 'Ada Lovelace',
        email: 'ada@example.com',
        baseCv: null,
        githubRepo: null,
        githubTokenEncrypted: null,
    };

    beforeEach(() => {
        jest.resetAllMocks();
        repository.findUserCvRecord.mockResolvedValue(record);
        repository.findLatestBaseVersion.mockResolvedValue(null);
        profileService.getProfile.mockResolvedValue(profile);
    });

    it('should build a base CV from the profile when none has been saved', async () => {
        const editor = await service.getEditor(USER_ID);

        expect(editor.selection.header.fullName).toBe('Ada Lovelace');
        expect(editor.document.experience.map((entry) => entry.title)).toEqual(['Engineer']);
        expect(editor.isCustomized).toBe(false);
        expect(editor.removedItemCount).toBe(0);
        expect(editor.templateId).toBe(DEFAULT_CV_TEMPLATE_ID);
        expect(editor.html).toContain('Engineer');
    });

    it('should reject a selection that references another users item', async () => {
        await expect(service.saveBaseCv(USER_ID, selection([MISSING_ID]))).rejects.toBeInstanceOf(CvItemNotFoundError);
        expect(repository.saveBaseCv.mock.calls).toHaveLength(0);
    });

    it('should skip a deleted profile item in the preview and the next snapshot', async () => {
        repository.findUserCvRecord.mockResolvedValue({
            ...record,
            baseCv: selection([ITEM_ID, MISSING_ID]),
        });
        repository.createBaseVersion.mockResolvedValue({
            id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd301',
            isBase: true,
            templateId: DEFAULT_CV_TEMPLATE_ID,
            gitPath: BASE_CV_JSON_PATH,
            commitSha: null,
            createdAt: new Date('2026-10-10T12:00:00.000Z'),
        });

        const editor = await service.getEditor(USER_ID);

        expect(editor.removedItemCount).toBe(1);
        expect(editor.selection.experienceItemIds).toEqual([ITEM_ID]);
        expect(editor.document.experience.map((entry) => entry.careerItemId)).toEqual([ITEM_ID]);
        expect(editor.html).not.toContain(MISSING_ID);

        await service.saveBaseVersion(USER_ID);

        const savedDocument = repository.createBaseVersion.mock.calls[0]?.[1].document;
        expect(savedDocument?.experience.map((entry) => entry.careerItemId)).toEqual([ITEM_ID]);
    });

    it('should drop a stored id that no longer exists and reject one that was never stored', async () => {
        repository.findUserCvRecord.mockResolvedValue({
            ...record,
            baseCv: selection([ITEM_ID, MISSING_ID]),
        });

        await service.saveBaseCv(USER_ID, selection([ITEM_ID, MISSING_ID]));

        expect(repository.saveBaseCv.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ experienceItemIds: [ITEM_ID] }));
        await expect(service.saveBaseCv(USER_ID, selection(['0199bcdf-20fc-744f-bc8b-6ef7c25cd198']))).rejects.toBeInstanceOf(
            CvItemNotFoundError,
        );
    });

    it('should save a local version when GitHub is not connected', async () => {
        const stored: StoredCvVersion = {
            id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd301',
            isBase: true,
            templateId: DEFAULT_CV_TEMPLATE_ID,
            gitPath: BASE_CV_JSON_PATH,
            commitSha: null,
            createdAt: new Date('2026-10-10T12:00:00.000Z'),
        };
        repository.createBaseVersion.mockResolvedValue(stored);

        const version = await service.saveBaseVersion(USER_ID);

        expect(githubClient.commitFiles.mock.calls).toHaveLength(0);
        expect(version.commitSha).toBeNull();
        expect(repository.createBaseVersion.mock.calls[0]).toEqual([
            USER_ID,
            expect.objectContaining({ commitSha: null, gitPath: BASE_CV_JSON_PATH }),
        ]);
    });

    it('should commit the json and html and store the sha when GitHub is connected', async () => {
        const token = encryptToken('ghp_secret', KEY);
        repository.findUserCvRecord.mockResolvedValue({
            ...record,
            githubRepo: 'ada/cv',
            githubTokenEncrypted: token,
        });
        githubClient.commitFiles.mockResolvedValue('abc123');
        repository.createBaseVersion.mockImplementation((_userId, version) =>
            Promise.resolve({
                id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd301',
                isBase: true,
                templateId: version.templateId,
                gitPath: version.gitPath,
                commitSha: version.commitSha,
                createdAt: new Date('2026-10-10T12:00:00.000Z'),
            }),
        );

        const version = await service.saveBaseVersion(USER_ID);

        expect(version.commitSha).toBe('abc123');
        expect(githubClient.commitFiles.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({
                repo: 'ada/cv',
                token: 'ghp_secret',
                files: [
                    expect.objectContaining({ path: BASE_CV_JSON_PATH }),
                    expect.objectContaining({ path: BASE_CV_HTML_PATH }),
                ],
            }),
        );
        expect(decryptToken(token, KEY)).toBe('ghp_secret');
    });

    it('should not store a version when the GitHub commit fails', async () => {
        repository.findUserCvRecord.mockResolvedValue({
            ...record,
            githubRepo: 'ada/cv',
            githubTokenEncrypted: encryptToken('ghp_secret', KEY),
        });
        githubClient.commitFiles.mockRejectedValue(new BadRequestException('rejected'));

        await expect(service.saveBaseVersion(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
        expect(repository.createBaseVersion.mock.calls).toHaveLength(0);
    });
});
