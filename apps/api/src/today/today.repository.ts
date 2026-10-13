import type { TodayApplicationRecord } from './types/today.types';

export abstract class TodayRepository {
    abstract listWithoutTailoredCv(userId: string): Promise<TodayApplicationRecord[]>;
    abstract countInProgress(userId: string): Promise<number>;
}
