import { type StatusesRepository } from './statuses.repository';
import { StatusesService } from './statuses.service';
import type { StatusRecord } from './types/statuses.types';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';

describe('StatusesService', () => {
    const repository = {
        listVisible: jest.fn(),
        findVisible: jest.fn(),
    } as jest.Mocked<StatusesRepository>;
    const service = new StatusesService(repository);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should list system and custom statuses visible to the current user', async () => {
        const saved: StatusRecord = {
            id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd201',
            key: 'saved',
            name: 'Saved',
            color: null,
            position: 0,
            category: 'open',
        };
        repository.listVisible.mockResolvedValue([saved]);

        await expect(service.list(USER_ID)).resolves.toEqual({ items: [saved] });
        expect(repository.listVisible.mock.calls).toEqual([[USER_ID]]);
    });
});
