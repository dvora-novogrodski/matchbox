import type { UpdateApplicationKit } from '@matchbox/shared';

import { KitNotFoundError } from './kit.errors';
import { KitService } from './kit.service';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const APPLICATION_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd125';

const STORED_KIT: UpdateApplicationKit = {
    coverLetter: 'Hello',
    whyCompany: 'Because',
    whyRole: 'The work',
    aboutYou: 'I build',
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

describe('KitService', () => {
    const kitRepository = {
        find: jest.fn(),
        save: jest.fn(),
    };
    const cvService = { renderPdf: jest.fn() };
    const pdfRenderer = { renderHtml: jest.fn() };
    const service = new KitService(kitRepository, cvService, pdfRenderer);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return an empty kit before the first save', async () => {
        kitRepository.find.mockResolvedValue({ kit: null, cv: null });

        await expect(service.get(USER_ID, APPLICATION_ID)).resolves.toEqual({
            coverLetter: '',
            whyCompany: '',
            whyRole: '',
            aboutYou: '',
            saved: false,
        });
    });

    it('should return the saved kit', async () => {
        kitRepository.find.mockResolvedValue({ kit: STORED_KIT, cv: null });

        await expect(service.get(USER_ID, APPLICATION_ID)).resolves.toEqual({ ...STORED_KIT, saved: true });
    });

    it('should ignore a stored kit that does not match the schema', async () => {
        kitRepository.find.mockResolvedValue({ kit: { coverLetter: 1 }, cv: null });

        await expect(service.get(USER_ID, APPLICATION_ID)).resolves.toEqual({
            coverLetter: '',
            whyCompany: '',
            whyRole: '',
            aboutYou: '',
            saved: false,
        });
    });

    it('should save the kit for the users application', async () => {
        kitRepository.save.mockResolvedValue(true);

        await expect(service.update(USER_ID, APPLICATION_ID, STORED_KIT)).resolves.toEqual({
            ...STORED_KIT,
            saved: true,
        });
        expect(kitRepository.save).toHaveBeenCalledWith(USER_ID, APPLICATION_ID, STORED_KIT);
    });

    it('should fail when the application is missing', async () => {
        kitRepository.find.mockResolvedValue(null);
        kitRepository.save.mockResolvedValue(false);

        await expect(service.get(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(KitNotFoundError);
        await expect(service.update(USER_ID, APPLICATION_ID, STORED_KIT)).rejects.toBeInstanceOf(KitNotFoundError);
        await expect(service.renderPdf(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(KitNotFoundError);
    });

    it('should render the saved job CV', async () => {
        kitRepository.find.mockResolvedValue({ kit: null, cv: JOB_CV });
        pdfRenderer.renderHtml.mockResolvedValue(Buffer.from('%PDF-job'));

        await expect(service.renderPdf(USER_ID, APPLICATION_ID)).resolves.toEqual(Buffer.from('%PDF-job'));
        expect(pdfRenderer.renderHtml).toHaveBeenCalledWith(expect.stringContaining('Ada Lovelace'));
        expect(cvService.renderPdf).not.toHaveBeenCalled();
    });

    it('should render the base CV when the job has no saved CV', async () => {
        kitRepository.find.mockResolvedValue({ kit: null, cv: null });
        cvService.renderPdf.mockResolvedValue(Buffer.from('%PDF-base'));

        await expect(service.renderPdf(USER_ID, APPLICATION_ID)).resolves.toEqual(Buffer.from('%PDF-base'));
        expect(cvService.renderPdf).toHaveBeenCalledWith(USER_ID);
        expect(pdfRenderer.renderHtml).not.toHaveBeenCalled();
    });
});
