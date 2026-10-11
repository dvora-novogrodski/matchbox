import type { CvVersion } from '@matchbox/shared';

import type { StoredCvVersion } from './types/cv.types';

export function toCvVersion(version: StoredCvVersion): CvVersion {
    return {
        id: version.id,
        isBase: version.isBase,
        templateId: version.templateId,
        gitPath: version.gitPath,
        commitSha: version.commitSha,
        createdAt: version.createdAt.toISOString(),
    };
}
