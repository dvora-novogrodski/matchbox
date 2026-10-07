import type { AuthIdentity, AuthUser } from '../auth/types/auth.types';
import { UsersService } from './users.service';

const IDENTITY: AuthIdentity = {
  firebaseUid: 'firebase-user-1',
  email: 'user@example.com',
  displayName: 'Matchbox User',
};

const USER: AuthUser = {
  id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd123',
  ...IDENTITY,
};

describe('UsersService', () => {
  const usersRepository = { findOrCreate: jest.fn() };
  const service = new UsersService(usersRepository);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findOrCreate', () => {
    it('should return the user provisioned by the repository', async () => {
      usersRepository.findOrCreate.mockResolvedValue(USER);

      await expect(service.findOrCreate(IDENTITY)).resolves.toEqual(USER);

      expect(usersRepository.findOrCreate).toHaveBeenCalledWith(IDENTITY);
    });
  });
});
