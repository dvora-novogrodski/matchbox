import { ProfileItemNotFoundError } from './profile.errors';
import { ProfileService } from './profile.service';
import type { ProfileRepository } from './profile.repository';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const ITEM_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';

describe('ProfileService', () => {
    const repository = {
        listItemsByKind: jest.fn(),
        findItem: jest.fn(),
        createItemWithBullets: jest.fn(),
        updateItemWithBullets: jest.fn(),
        deleteItem: jest.fn(),
        listSkills: jest.fn(),
        replaceSkills: jest.fn(),
    } as jest.Mocked<ProfileRepository>;
    const service = new ProfileService(repository);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return a grouped profile for the current user', async () => {
        repository.listItemsByKind.mockImplementation(async (_userId, kind) =>
            kind === 'experience'
                ? [
                      {
                          id: ITEM_ID,
                          kind: 'experience',
                          title: 'Engineer',
                          organization: 'Acme',
                          startDate: null,
                          endDate: null,
                          tech: [],
                          bullets: [{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd125', text: 'Shipped', position: 0 }],
                      },
                  ]
                : [],
        );
        repository.listSkills.mockResolvedValue([{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd126', name: 'TypeScript', position: 0 }]);

        await expect(service.getProfile(USER_ID)).resolves.toEqual({
            experience: [
                expect.objectContaining({
                    id: ITEM_ID,
                    bullets: [{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd125', text: 'Shipped' }],
                }),
            ],
            projects: [],
            education: [],
            skills: [{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd126', name: 'TypeScript' }],
        });
    });

    it('should reject an update when the item is not owned by the current user', async () => {
        repository.updateItemWithBullets.mockResolvedValue(null);

        await expect(service.updateExperience(USER_ID, ITEM_ID, { title: 'Other' })).rejects.toBeInstanceOf(
            ProfileItemNotFoundError,
        );
    });

    it('should dedupe skills case-insensitively before replace', async () => {
        repository.replaceSkills.mockResolvedValue([]);

        await service.replaceSkills(USER_ID, ['TypeScript', 'typescript', 'Go']);

        expect(repository.replaceSkills.mock.calls).toEqual([[USER_ID, ['TypeScript', 'Go']]]);
    });
});
