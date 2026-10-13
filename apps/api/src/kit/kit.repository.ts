import type { UpdateApplicationKit } from '@matchbox/shared';

import type { KitRecord } from './types/kit.types';

export abstract class KitRepository {
    abstract find(userId: string, applicationId: string): Promise<KitRecord | null>;

    abstract save(userId: string, applicationId: string, kit: UpdateApplicationKit): Promise<boolean>;
}
