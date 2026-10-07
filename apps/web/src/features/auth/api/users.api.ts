import { type CurrentUser, CurrentUserSchema } from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await httpClient.get<unknown>('/users/me');
  return CurrentUserSchema.parse(response.data);
}
