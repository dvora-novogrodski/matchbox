import type { Today } from '@matchbox/shared';
import { TodaySchema } from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function getToday(): Promise<Today> {
    const response = await httpClient.get<unknown>('/today');
    return TodaySchema.parse(response.data);
}
